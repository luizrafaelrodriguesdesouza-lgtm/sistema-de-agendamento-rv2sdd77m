routerAdd(
  'POST',
  '/backend/v1/owner-webhook-test',
  (e) => {
    const authRecord = e.auth
    if (
      !authRecord ||
      (authRecord.getString('tipo') !== 'proprietario' && authRecord.getString('tipo') !== 'master')
    ) {
      return e.forbiddenError('Acesso negado.')
    }

    const body = e.requestInfo().body || {}
    let webhookUrl = body.webhook_url

    if (!webhookUrl) {
      webhookUrl = authRecord.getString('webhook_url')
    }

    if (!webhookUrl) {
      return e.badRequestError('URL do webhook não fornecida.')
    }

    webhookUrl = webhookUrl.trim().replace(/[\n\r\t]/g, '')

    try {
      new URL(webhookUrl)
    } catch (_) {
      return e.badRequestError('URL de Webhook inválida.')
    }

    const payload = {
      event: 'test_connection',
      data: {
        cliente_nome: 'João Silva (Teste)',
        cliente_email: 'joao.silva@teste.com',
        cliente_telefone: '+5511999999999',
        profissional: 'Maria Cabeleireira',
        servico: 'Corte de Cabelo',
        valor: 50.0,
        data: '2024-12-25',
        hora: '14:00',
        referencia: 'REF-TEST-123',
      },
    }

    try {
      const res = $http.send({
        url: webhookUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 10,
      })

      const logsCol = $app.findCollectionByNameOrId('webhook_logs')
      const log = new Record(logsCol)
      log.set('event', 'test_webhook')
      log.set('status', res.statusCode)
      log.set('payload', Object.assign({}, payload, { request_url: webhookUrl }))

      let resBodyStr = ''
      if (res.json) {
        resBodyStr = JSON.stringify(res.json)
      } else if (res.body) {
        try {
          resBodyStr = new TextDecoder().decode(res.body)
        } catch (err) {
          resBodyStr = 'Non-text response'
        }
      }

      const responseLog = resBodyStr.substring(0, 500)
      log.set('response', responseLog)
      $app.save(log)

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return e.json(200, { success: true, status: res.statusCode, response: responseLog })
      } else {
        return e.json(400, {
          success: false,
          status: res.statusCode,
          error: responseLog || `HTTP ${res.statusCode}`,
        })
      }
    } catch (err) {
      const logsCol = $app.findCollectionByNameOrId('webhook_logs')
      const log = new Record(logsCol)
      log.set('event', 'test_webhook')
      log.set('status', 0)
      log.set('payload', Object.assign({}, payload, { request_url: webhookUrl }))
      const errorLog = (err.message || 'Falha na requisição').substring(0, 500)
      log.set('response', errorLog)
      $app.save(log)

      return e.json(400, { success: false, status: 0, error: errorLog, request_url: webhookUrl })
    }
  },
  $apis.requireAuth(),
)
