onRecordAfterUpdateSuccess((e) => {
  const agendamento = e.record
  const original = agendamento.original()

  if (
    agendamento.getString('status') !== 'confirmado' ||
    original.getString('status') === 'confirmado'
  ) {
    return e.next()
  }

  let records = []
  try {
    records = $app.findRecordsByFilter('settings', '', '-created', 1, 0)
  } catch (_) {
    return e.next()
  }

  if (records.length === 0) return e.next()

  let webhookUrl = records[0].getString('webhook_url')
  const webhookSecret = records[0].getString('webhook_secret')
  if (!webhookUrl) return e.next()

  webhookUrl = webhookUrl.trim().replace(/[\n\r\t]/g, '')

  let rawPhone = agendamento.getString('cliente_telefone') || ''
  let numbersOnly = rawPhone.replace(/\D/g, '')
  let formattedPhone = rawPhone
  if (numbersOnly) {
    if (numbersOnly.startsWith('55')) {
      formattedPhone = '+' + numbersOnly
    } else {
      formattedPhone = '+55' + numbersOnly
    }
  }

  const payload = {
    event: 'booking.confirmed',
    booking_id: agendamento.id,
    cliente_dados: {
      nome: agendamento.getString('cliente_nome'),
      email: agendamento.getString('cliente_email'),
      telefone: formattedPhone,
    },
    servico: agendamento.getString('servico_id'),
    data_hora_utc: agendamento.getString('data'),
    professional: agendamento.getString('profissional_id'),
  }

  let attempts = 0
  let success = false
  let lastStatus = 0
  let lastResponse = ''

  while (attempts < 3 && !success) {
    attempts++
    try {
      const res = $http.send({
        url: webhookUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookSecret ? { Authorization: webhookSecret } : {}),
        },
        body: JSON.stringify(payload),
        timeout: 5,
      })
      lastStatus = res.statusCode
      lastResponse = JSON.stringify(res.json || { raw: 'OK' })
      if (res.statusCode >= 200 && res.statusCode < 300) {
        success = true
      }
    } catch (err) {
      lastStatus = 0
      lastResponse = err.message || 'Falha na requisição'
    }
  }

  const logsCol = $app.findCollectionByNameOrId('webhook_logs')
  const log = new Record(logsCol)
  log.set('event', 'booking.confirmed')
  log.set('status', lastStatus)

  const payloadToLog = Object.assign({}, payload, { request_url: webhookUrl })
  if (!numbersOnly && rawPhone) {
    payloadToLog._warning = 'Invalid phone number format'
  }
  log.set('payload', payloadToLog)
  log.set('response', lastResponse)
  $app.save(log)

  if (!success) {
    const agToUpdate = $app.findRecordById('agendamentos', agendamento.id)
    agToUpdate.set('webhook_failed', true)
    $app.saveNoValidate(agToUpdate)
  }

  return e.next()
}, 'agendamentos')
