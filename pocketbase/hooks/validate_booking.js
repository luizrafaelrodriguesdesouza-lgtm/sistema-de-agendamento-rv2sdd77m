onRecordCreateRequest((e) => {
  const body = e.requestInfo().body
  if (!body.profissional_id || !body.servico_id || !body.data) {
    return e.next()
  }

  const newStart = new Date(body.data).getTime()
  if (isNaN(newStart)) return e.next()

  try {
    const servico = $app.findRecordById('servicos', body.servico_id)
    const duracao = servico.getInt('duracao') || 30
    const newEnd = newStart + duracao * 60000

    const startOfDay = new Date(body.data)
    startOfDay.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(body.data)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const apps = $app.findRecordsByFilter(
      'agendamentos',
      `profissional_id = '${body.profissional_id}' && status != 'cancelado' && data >= '${startOfDay.toISOString().replace('T', ' ')}' && data <= '${endOfDay.toISOString().replace('T', ' ')}'`,
      '',
      100,
      0,
    )

    for (const app of apps) {
      let dateStr = app.getString('data')
      if (!dateStr.endsWith('Z')) dateStr = dateStr.replace(' ', 'T') + 'Z'

      const appStart = new Date(dateStr).getTime()
      const appServicoId = app.getString('servico_id')
      let appDuracao = 30

      if (appServicoId) {
        try {
          const appServico = $app.findRecordById('servicos', appServicoId)
          appDuracao = appServico.getInt('duracao') || 30
        } catch (_) {}
      }

      const appEnd = appStart + appDuracao * 60000

      if (newStart < appEnd && newEnd > appStart) {
        throw new BadRequestError('Horário indisponível, escolha outro')
      }
    }
  } catch (err) {
    if (err instanceof BadRequestError) {
      throw err
    }
    $app.logger().error('Error validating booking', 'msg', err.message)
  }

  return e.next()
}, 'agendamentos')
