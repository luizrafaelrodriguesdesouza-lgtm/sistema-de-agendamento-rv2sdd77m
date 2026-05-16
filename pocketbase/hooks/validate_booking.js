onRecordCreateRequest((e) => {
  const body = e.requestInfo().body

  const auth = e.auth
  if (auth && auth.getString('tipo') === 'cliente') {
    e.record.set('cliente_id', auth.id)
    if (auth.getString('name')) e.record.set('cliente_nome', auth.getString('name'))
    if (auth.getString('email')) e.record.set('cliente_email', auth.getString('email'))
  } else if (
    !auth ||
    (auth.getString('tipo') !== 'master' &&
      auth.getString('tipo') !== 'proprietario' &&
      auth.getString('tipo') !== 'profissional')
  ) {
    e.record.set('cliente_id', '')
  }

  if (!body.profissional_id || !body.servico_id || !body.data) {
    return e.next()
  }

  const reqTime = new Date(body.data).getTime()
  if (isNaN(reqTime)) return e.next()

  let bufferMinutes = 15
  try {
    const settings = $app.findRecordsByFilter('settings', '', '', 1, 0)
    if (settings.length > 0) {
      bufferMinutes = settings[0].getInt('buffer_duration') || 15
    }
  } catch (_) {}

  const leadTimeMs = Math.max(30 * 60000, bufferMinutes * 60000)

  if ((!auth || auth.getString('tipo') === 'cliente') && reqTime <= Date.now() + leadTimeMs) {
    return e.json(400, {
      status: 'error',
      message: 'O horário selecionado é no passado ou muito próximo. Escolha outro horário.',
    })
  }

  try {
    const servico = $app.findRecordById('servicos', body.servico_id)
    const duracao = servico.getInt('duracao') || 30

    const requestedStart = reqTime
    const requestedEnd = reqTime + duracao * 60000 + bufferMinutes * 60000

    const searchStart = new Date(requestedStart - 24 * 60 * 60000)
    const searchEnd = new Date(requestedEnd + 24 * 60 * 60000)

    const apps = $app.findRecordsByFilter(
      'agendamentos',
      `profissional_id = '${body.profissional_id}' && status != 'cancelado' && data >= '${searchStart.toISOString().replace('T', ' ')}' && data <= '${searchEnd.toISOString().replace('T', ' ')}'`,
      '',
      100,
      0,
    )

    const conflicts = []

    for (const app of apps) {
      let dateStr = app.getString('data')
      if (!dateStr.endsWith('Z')) dateStr = dateStr.replace(' ', 'T') + 'Z'

      const appTime = new Date(dateStr).getTime()
      const appServicoId = app.getString('servico_id')
      let appDuracao = 30

      if (appServicoId) {
        try {
          const appServico = $app.findRecordById('servicos', appServicoId)
          appDuracao = appServico.getInt('duracao') || 30
        } catch (_) {}
      }

      const existingStart = appTime
      const existingEnd = appTime + appDuracao * 60000 + bufferMinutes * 60000

      if (existingStart < requestedEnd && existingEnd > requestedStart) {
        conflicts.push({
          cliente_nome: app.getString('cliente_nome') || 'Cliente',
          data: app.getString('data'),
          profissional_id: app.getString('profissional_id'),
        })
      }
    }

    if (conflicts.length > 0) {
      $app
        .logger()
        .info('Conflict detected', 'payload', body, 'reason', 'Time overlap with buffers')
      return e.json(409, {
        status: 'conflict',
        message: 'Horário indisponível, escolha outro',
        details: conflicts,
      })
    }
  } catch (err) {
    $app.logger().error('Error validating booking', 'msg', err.message)
  }

  return e.next()
}, 'agendamentos')
