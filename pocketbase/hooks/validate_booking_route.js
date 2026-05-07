routerAdd('POST', '/backend/v1/agendamentos/validate', (e) => {
  const body = e.requestInfo().body
  if (!body.profissional_id || !body.servico_id || !body.data) {
    return e.badRequestError('Dados incompletos')
  }

  const reqTime = new Date(body.data).getTime()
  if (isNaN(reqTime)) return e.badRequestError('Data inválida')

  let bufferMinutes = 15
  try {
    const settings = $app.findRecordsByFilter('settings', '', '', 1, 0)
    if (settings.length > 0) {
      bufferMinutes = settings[0].getInt('buffer_duration') || 15
    }
  } catch (_) {}

  try {
    const servico = $app.findRecordById('servicos', body.servico_id)
    const duracao = servico.getInt('duracao') || 30

    const requestedStart = reqTime - bufferMinutes * 60000
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

      const existingStart = appTime - bufferMinutes * 60000
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
        .error(
          'Conflict detected via validation endpoint',
          'payload',
          body,
          'reason',
          'Time overlap with buffers',
        )
      return e.json(409, {
        status: 'conflict',
        message: 'Horário indisponível, escolha outro',
        details: conflicts,
      })
    }

    return e.json(200, { status: 'ok' })
  } catch (err) {
    return e.internalServerError(err.message)
  }
})
