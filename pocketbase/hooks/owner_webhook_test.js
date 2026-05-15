routerAdd(
  'POST',
  '/backend/v1/webhooks/test-owner',
  (e) => {
    const authRecord = e.auth
    if (
      !authRecord ||
      (authRecord.getString('tipo') !== 'proprietario' && authRecord.getString('tipo') !== 'master')
    ) {
      return e.forbiddenError('Acesso negado.')
    }

    const body = e.requestInfo().body
    const webhookUrl = body.webhook_url

    if (!webhookUrl) {
      return e.badRequestError('URL do webhook não fornecida.')
    }

    try {
      new URL(webhookUrl)
    } catch (_) {
      return e.badRequestError('URL de Webhook inválida.')
    }

    const payload = {
      event: 'appointment_created',
      data: {
        cliente_nome: 'João Silva (Teste)',
        cliente_telefone: '+5511999999999',
        servico: 'Serviço de Teste',
        profissional: 'Profissional Teste',
        data: '2024-01-01',
        hora: '10:00',
        valor: 50.0,
      },
    }

    const start = Date.now()
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
      const timeMs = Date.now() - start

      const logsCol = $app.findCollectionByNameOrId('webhook_logs')
      const log = new Record(logsCol)
      log.set('event', 'appointment_created_test')
      log.set('status', res.statusCode)
      log.set('payload', payload)

      const responseObj = { timeMs, body: res.json || { raw: 'Non-JSON response or empty' } }
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
      log.set('event', 'appointment_created_test')
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
