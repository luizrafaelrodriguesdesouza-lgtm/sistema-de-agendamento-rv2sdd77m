onRecordAfterCreateSuccess((e) => {
  let records = []
  try {
    records = $app.findRecordsByFilter('settings', '', '-created', 1, 0)
  } catch (_) {
    return e.next()
  }

  if (records.length === 0) return e.next()

  const webhookUrl = records[0].getString('webhook_url')
  if (!webhookUrl) return e.next()

  const agendamento = e.record
  $app.expandRecord(agendamento, ['profissional_id'])

  const profissional = agendamento.expandedOne('profissional_id')
  const proprietario_id = profissional
    ? profissional.getString('proprietario_id') || profissional.id
    : ''

  const payload = {
    event: 'booking.created',
    agendamento_id: agendamento.id,
    proprietario_id: proprietario_id,
    profissional_id: agendamento.getString('profissional_id'),
    servico_id: agendamento.getString('servico_id'),
    cliente_nome: agendamento.getString('cliente_nome'),
    cliente_email: agendamento.getString('cliente_email'),
    cliente_telefone: agendamento.getString('cliente_telefone'),
    data: agendamento.getString('data'),
    referencia: agendamento.getString('referencia'),
    status: agendamento.getString('status'),
    timestamp: new Date().toISOString(),
  }

  try {
    const res = $http.send({
      url: webhookUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 10,
    })

    const logsCol = $app.findCollectionByNameOrId('webhook_logs')
    const log = new Record(logsCol)
    log.set('event', 'booking.created')
    log.set('status', res.statusCode)
    log.set('payload', payload)
    log.set('response', JSON.stringify(res.json || { raw: 'OK' }))
    $app.save(log)
  } catch (err) {
    const logsCol = $app.findCollectionByNameOrId('webhook_logs')
    const log = new Record(logsCol)
    log.set('event', 'booking.created')
    log.set('status', 0)
    log.set('payload', payload)
    log.set('response', err.message || 'Falha na requisição')
    $app.save(log)
  }

  return e.next()
}, 'agendamentos')
