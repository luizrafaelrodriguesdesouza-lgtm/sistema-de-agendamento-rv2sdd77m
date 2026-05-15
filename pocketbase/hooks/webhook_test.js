routerAdd(
  'POST',
  '/backend/v1/webhooks/test',
  (e) => {
    const authRecord = e.auth
    if (!authRecord || authRecord.getString('tipo') !== 'master') {
      return e.forbiddenError('Acesso negado. Apenas masters podem testar webhooks.')
    }

    let records = []
    try {
      records = $app.findRecordsByFilter('settings', '', '-created', 1, 0)
    } catch (_) {
      return e.badRequestError('URL do webhook não configurada.')
    }

    if (records.length === 0) {
      return e.badRequestError('URL do webhook não configurada.')
    }

    const webhookUrl = records[0].getString('webhook_url')
    const webhookSecret = records[0].getString('webhook_secret')
    if (!webhookUrl) {
      return e.badRequestError('URL do webhook não configurada.')
    }

    const payload = {
      event: 'test_connection',
      timestamp: new Date().toISOString(),
      data: {
        id: 'test_123',
        cliente_nome: 'Cliente Teste',
        cliente_email: 'teste@exemplo.com',
        cliente_telefone: '+5511999999999',
        data: new Date().toISOString(),
        status: 'pendente',
        referencia: 'REF-TEST-123',
      },
    }

    const start = Date.now()
    try {
      const res = $http.send({
        url: webhookUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookSecret ? { Authorization: webhookSecret } : {}),
        },
        body: JSON.stringify(payload),
        timeout: 10,
      })
      const timeMs = Date.now() - start

      const logsCol = $app.findCollectionByNameOrId('webhook_logs')
      const log = new Record(logsCol)
      log.set('event', 'test_connection')
      log.set('status', res.statusCode)
      log.set('payload', payload)
      const responseObj = { timeMs, body: res.json || { raw: 'OK' } }
      log.set('response', JSON.stringify(responseObj))
      $app.save(log)

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return e.json(200, { success: true, status: res.statusCode, timeMs, response: responseObj })
      } else {
        return e.badRequestError(`O servidor retornou erro HTTP ${res.statusCode} em ${timeMs}ms`)
      }
    } catch (err) {
      const timeMs = Date.now() - start
      const logsCol = $app.findCollectionByNameOrId('webhook_logs')
      const log = new Record(logsCol)
      log.set('event', 'test_connection')
      log.set('status', 0)
      log.set('payload', payload)
      const responseObj = { timeMs, error: err.message || 'Falha na requisição' }
      log.set('response', JSON.stringify(responseObj))
      $app.save(log)

      return e.badRequestError(`Erro de conexão ou timeout: ${err.message} (${timeMs}ms)`)
    }
  },
  $apis.requireAuth(),
)
