routerAdd('POST', '/backend/v1/agendamentos/validate', (e) => {
  const body = e.requestInfo().body
  if (!body.profissional_id || !body.data) {
    return e.json(400, { message: 'Dados inválidos' })
  }

  const reqStart = new Date(body.data)

  let duracao = 30
  if (body.servico_id) {
    try {
      const serv = $app.findRecordById('servicos', body.servico_id)
      duracao = serv.getInt('duracao') || 30
    } catch (_) {}
  }

  let bufferMinutes = 15
  try {
    const settings = $app.findRecordsByFilter('settings', '', '', 1, 0)
    if (settings && settings.length > 0) {
      bufferMinutes = settings[0].getInt('buffer_duration') || 15
    }
  } catch (_) {}

  const reqEnd = new Date(reqStart.getTime() + duracao * 60000)

  const startStr = new Date(reqStart.getTime() - 24 * 60000).toISOString().replace('T', ' ')
  const endStr = new Date(reqEnd.getTime() + 24 * 60000).toISOString().replace('T', ' ')

  const agendamentos = $app.findRecordsByFilter(
    'agendamentos',
    `profissional_id = '${body.profissional_id}' && status != 'cancelado' && data >= '${startStr}' && data <= '${endStr}'`,
    '',
    100,
    0,
  )

  const conflicts = []
  for (const a of agendamentos) {
    const aStart = new Date(a.getString('data'))
    let aDur = 30
    try {
      const sId = a.getString('servico_id')
      if (sId) {
        const s = $app.findRecordById('servicos', sId)
        aDur = s.getInt('duracao') || 30
      }
    } catch (_) {}

    const aEnd = new Date(aStart.getTime() + aDur * 60000)

    const bStart = new Date(aStart.getTime() - bufferMinutes * 60000)
    const bEnd = new Date(aEnd.getTime() + bufferMinutes * 60000)

    const rbStart = new Date(reqStart.getTime() - bufferMinutes * 60000)
    const rbEnd = new Date(reqEnd.getTime() + bufferMinutes * 60000)

    if (bStart < rbEnd && bEnd > rbStart) {
      conflicts.push({
        id: a.id,
        data: a.getString('data'),
        cliente_nome: a.getString('cliente_nome') || 'Cliente',
      })
    }
  }

  if (conflicts.length > 0) {
    return e.json(409, {
      message: 'Horário em conflito com outro agendamento.',
      details: conflicts,
    })
  }

  return e.json(200, { success: true })
})
