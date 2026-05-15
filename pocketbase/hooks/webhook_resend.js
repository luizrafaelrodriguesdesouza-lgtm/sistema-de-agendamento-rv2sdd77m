routerAdd(
  'POST',
  '/backend/v1/webhooks/resend/{id}',
  (e) => {
    const authRecord = e.auth
    if (
      !authRecord ||
      (authRecord.getString('tipo') !== 'master' && authRecord.getString('tipo') !== 'proprietario')
    ) {
      return e.forbiddenError('Acesso negado.')
    }

    const id = e.request.pathValue('id')
    let agendamento
    try {
      agendamento = $app.findRecordById('agendamentos', id)
    } catch (_) {
      return e.notFoundError('Agendamento não encontrado.')
    }

    let records = []
    try {
      records = $app.findRecordsByFilter('settings', '', '-created', 1, 0)
    } catch (_) {
      return e.badRequestError('Configurações não encontradas.')
    }

    if (records.length === 0) return e.badRequestError('Configurações não encontradas.')

    const webhookUrl = records[0].getString('webhook_url')
    const webhookSecret = records[0].getString('webhook_secret')
    if (!webhookUrl) return e.badRequestError('URL do webhook não configurada.')

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
    log.set('event', 'booking.resend')
    log.set('status', lastStatus)

    const payloadToLog = Object.assign({}, payload)
    if (!numbersOnly && rawPhone) {
      payloadToLog._warning = 'Invalid phone number format'
    }
    log.set('payload', payloadToLog)
    log.set('response', lastResponse)
    $app.save(log)

    if (success) {
      agendamento.set('webhook_failed', false)
      $app.saveNoValidate(agendamento)
      return e.json(200, { success: true })
    } else {
      return e.json(500, { error: 'Falha ao reenviar webhook', lastResponse })
    }
  },
  $apis.requireAuth(),
)
