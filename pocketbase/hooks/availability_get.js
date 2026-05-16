routerAdd('GET', '/backend/v1/availability', (e) => {
  const query = e.requestInfo().query
  const profissionalId = query['profissional_id']
  const dateStr = query['date']
  const servicoId = query['servico_id']
  const dayOfWeekStr = query['day_of_week']

  if (!profissionalId || !dateStr || !servicoId || !dayOfWeekStr) {
    return e.badRequestError(
      'Missing required parameters: profissional_id, date, servico_id, day_of_week',
    )
  }

  const dayOfWeek = parseInt(dayOfWeekStr, 10)
  const dayStartMs = new Date(dateStr).getTime()

  if (isNaN(dayStartMs)) {
    return e.badRequestError('Invalid date format')
  }

  // 1. Check Professional and Service
  let serviceDuration = 30
  try {
    const prof = $app.findRecordById('users', profissionalId)
    if (prof.getString('status_aprovacao') !== 'aprovado' || prof.getString('deleted_at') !== '') {
      return e.json(200, { available_times: [] })
    }
    const servico = $app.findRecordById('servicos', servicoId)
    if (!servico.getBool('ativo')) {
      return e.json(200, { available_times: [] })
    }
    serviceDuration = servico.getInt('duracao') || 30
  } catch (_) {
    return e.badRequestError('Serviço ou profissional não encontrado')
  }

  // 2. Get Buffer Duration
  let bufferMinutes = 15
  try {
    const settingsList = $app.findRecordsByFilter('settings', "id != ''", '', 1, 0)
    if (settingsList.length > 0) {
      bufferMinutes = settingsList[0].getInt('buffer_duration')
    }
  } catch (_) {}

  // 3. Get Schedules
  let schedules = []
  try {
    schedules = $app.findRecordsByFilter(
      'horarios_disponiveis',
      'profissional_id = {:pid} && dia_semana = {:dow}',
      '',
      100,
      0,
      { pid: profissionalId, dow: dayOfWeek },
    )
  } catch (_) {}

  if (schedules.length === 0) {
    return e.json(200, { available_times: [] })
  }

  // 4. Get Appointments
  const searchStartD = new Date(dayStartMs - 24 * 3600000)
  const searchEndD = new Date(dayStartMs + 48 * 3600000)
  const searchStartIso = searchStartD.toISOString().replace('T', ' ')
  const searchEndIso = searchEndD.toISOString().replace('T', ' ')

  let appointments = []
  try {
    appointments = $app.findRecordsByFilter(
      'agendamentos',
      "profissional_id = {:pid} && data >= {:start} && data <= {:end} && status != 'cancelado'",
      '',
      1000,
      0,
      { pid: profissionalId, start: searchStartIso, end: searchEndIso },
    )
  } catch (_) {}

  // Pre-calculate busy blocks
  const busyBlocks = []
  for (let i = 0; i < appointments.length; i++) {
    const appt = appointments[i]
    const apptDateStr = appt.getString('data')
    const safeDateStr = apptDateStr.replace(' ', 'T')
    const apptStart = new Date(safeDateStr).getTime()

    let apptDuration = 30
    try {
      const sId = appt.getString('servico_id')
      if (sId) {
        const s = $app.findRecordById('servicos', sId)
        apptDuration = s.getInt('duracao') || 30
      }
    } catch (_) {}

    const bStart = apptStart
    const bEnd = apptStart + apptDuration * 60000 + bufferMinutes * 60000
    busyBlocks.push({ start: bStart, end: bEnd })
  }

  const availableTimes = []

  // 5. Generate slots
  for (let i = 0; i < schedules.length; i++) {
    const sched = schedules[i]
    const hInicio = sched.getString('hora_inicio')
    const hFim = sched.getString('hora_fim')

    const [startH, startM] = hInicio.split(':').map(Number)
    const [endH, endM] = hFim.split(':').map(Number)

    const shiftStartMs = dayStartMs + startH * 3600000 + startM * 60000
    const shiftEndMs = dayStartMs + endH * 3600000 + endM * 60000

    let currentSlotMs = shiftStartMs

    while (currentSlotMs + serviceDuration * 60000 <= shiftEndMs) {
      const slotStart = currentSlotMs
      const slotEnd = currentSlotMs + serviceDuration * 60000 + bufferMinutes * 60000

      let isBusy = false
      for (let j = 0; j < busyBlocks.length; j++) {
        const b = busyBlocks[j]
        if (slotStart < b.end && slotEnd > b.start) {
          isBusy = true
          break
        }
      }

      // Grace period: hide slots that are too soon
      const leadTimeMs = Math.max(30 * 60000, bufferMinutes * 60000)
      const isPastOrTooSoon = slotStart <= Date.now() + leadTimeMs

      if (!isBusy && !isPastOrTooSoon) {
        const msFromMidnight = currentSlotMs - dayStartMs
        const totalMinutes = Math.floor(msFromMidnight / 60000)
        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60

        const hStr = h.toString().padStart(2, '0')
        const mStr = m.toString().padStart(2, '0')
        availableTimes.push(`${hStr}:${mStr}`)
      }

      currentSlotMs += 15 * 60000
    }
  }

  const uniqueTimes = [...new Set(availableTimes)].sort()

  return e.json(200, { available_times: uniqueTimes, buffer_duration: bufferMinutes })
})
