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

    const payload = { event: 'test.dispatched', timestamp: new Date().toISOString() }

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

      const logsCol = $app.findCollectionByNameOrId('webhook_logs')
      const log = new Record(logsCol)
      log.set('event', 'test.dispatched')
      log.set('status', res.statusCode)
      log.set('payload', payload)
      log.set('response', JSON.stringify(res.json || { raw: 'OK' }))
      $app.save(log)

      return e.json(200, { success: true, status: res.statusCode })
    } catch (err) {
      const logsCol = $app.findCollectionByNameOrId('webhook_logs')
      const log = new Record(logsCol)
      log.set('event', 'test.dispatched')
      log.set('status', 0)
      log.set('payload', payload)
      log.set('response', err.message || 'Falha na requisição')
      $app.save(log)

      return e.json(500, { error: 'Falha ao enviar webhook' })
    }
  },
  $apis.requireAuth(),
)
