onRecordAfterCreateSuccess(async (e) => {
  const record = e.record
  const phone = record.getString('cliente_telefone')
  const bookingId = record.id

  // Fetch the service name
  let servicoNome = 'Serviço'
  try {
    const servico = $app.findRecordById('servicos', record.getString('servico_id'))
    servicoNome = servico.getString('nome')
  } catch (_) {}

  // Format date and time
  const dataRaw = record.getString('data')
  let dataStr = dataRaw
  let horaStr = ''
  try {
    const d = new Date(dataRaw)
    // Adjust for BRT timezone (-3h) for message formatting
    const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
    dataStr =
      local.getUTCDate().toString().padStart(2, '0') +
      '/' +
      (local.getUTCMonth() + 1).toString().padStart(2, '0') +
      '/' +
      local.getUTCFullYear()
    horaStr =
      local.getUTCHours().toString().padStart(2, '0') +
      ':' +
      local.getUTCMinutes().toString().padStart(2, '0')
  } catch (_) {}

  const messageText = `Confirmação: Seu agendamento de ${servicoNome} está marcado para ${dataStr} às ${horaStr}. Código: ${bookingId}.`

  // Helper to write to whatsapp_logs
  const logStatus = (status, errMsg) => {
    try {
      const logsCol = $app.findCollectionByNameOrId('whatsapp_logs')
      const logRec = new Record(logsCol)
      logRec.set('booking_id', bookingId)
      logRec.set('phone_number', phone || '')
      logRec.set('message_text', messageText)
      logRec.set('status', status)
      if (errMsg) logRec.set('error_message', String(errMsg))
      $app.save(logRec)
    } catch (err) {
      $app.logger().error('Failed to save whatsapp_log', 'error', err.message)
    }
  }

  // Validate phone number
  if (!phone || !phone.match(/\d{10,}/)) {
    logStatus('skipped', 'Número de telefone inválido ou ausente')
    return e.next()
  }

  const token = $secrets.get('WHATSAPP_ACCESS_TOKEN')
  const phoneId = $secrets.get('WHATSAPP_PHONE_ID')

  if (!token || !phoneId) {
    logStatus('skipped', 'Credenciais do WhatsApp ausentes no ambiente')
    return e.next()
  }

  const cleanPhone = phone.replace(/\D/g, '')
  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`
  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'text',
    text: { body: messageText },
  }

  // Function to perform the request
  const sendMsg = () => {
    try {
      const res = $http.send({
        url: url,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 15,
      })
      return { statusCode: res.statusCode, json: res.json, error: null }
    } catch (err) {
      return { statusCode: 0, error: err.message }
    }
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  let attempt = 1
  let success = false
  let lastError = ''

  // Retry Logic Loop
  while (attempt <= 2 && !success) {
    const res = sendMsg()

    if (res.statusCode >= 200 && res.statusCode < 300) {
      success = true
      logStatus('sent', '')
    } else {
      lastError =
        res.error ||
        `HTTP ${res.statusCode}: ${res.json ? JSON.stringify(res.json) : 'Unknown error'}`

      if (res.statusCode === 401) {
        logStatus('failed', `Auth Error: ${lastError}`)
        break // Do not retry on auth failures
      }

      if (attempt === 1) {
        if (res.statusCode === 429) {
          await sleep(60000) // Wait 60s on Rate Limit
        } else {
          await sleep(5000) // Standard retry delay
        }
      }
    }
    attempt++
  }

  // Handle complete failure
  if (!success && lastError && !lastError.includes('Auth Error')) {
    logStatus('failed', lastError)

    try {
      let adminEmail = 'admin@example.com'
      try {
        const masters = $app.findRecordsByFilter('users', "tipo = 'master'", '', 1, 0)
        if (masters && masters.length > 0) {
          adminEmail = masters[0].getString('email')
        }
      } catch (_) {}

      const message = new MailerMessage({
        from: {
          address: $app.settings().meta.senderAddress || 'system@agendamais.com',
          name: 'Sistema Agenda+',
        },
        to: [{ address: adminEmail }],
        subject: 'Falha Crítica no Envio de WhatsApp',
        html: `
                    <p>O sistema não conseguiu enviar a mensagem de confirmação para o cliente via WhatsApp API após todas as tentativas.</p>
                    <p><strong>Telefone:</strong> ${cleanPhone}</p>
                    <p><strong>Agendamento ID:</strong> ${bookingId}</p>
                    <p><strong>Detalhes do Erro:</strong> ${lastError}</p>
                `,
      })

      $app.newMailClient().send(message)
    } catch (emailErr) {
      $app.logger().error('Failed to send admin alert email', 'error', emailErr.message)
    }
  }

  return e.next()
}, 'agendamentos')
