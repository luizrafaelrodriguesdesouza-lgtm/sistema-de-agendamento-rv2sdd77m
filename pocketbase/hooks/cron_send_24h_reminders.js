cronAdd('send_24h_reminders', '0 * * * *', async () => {
  const now = new Date()
  const targetTimeMin = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const targetTimeMax = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const pad = (n) => n.toString().padStart(2, '0')
  const formatPBDate = (d) => {
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
      d.getUTCHours(),
    )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.000Z`
  }

  const minStr = formatPBDate(targetTimeMin)
  const maxStr = formatPBDate(targetTimeMax)

  let agendamentos = []
  try {
    agendamentos = $app.findRecordsByFilter(
      'agendamentos',
      `status = 'confirmado' && data >= '${minStr}' && data <= '${maxStr}'`,
      '',
      1000,
      0,
    )
  } catch (_) {
    return
  }

  const token = $secrets.get('WHATSAPP_ACCESS_TOKEN')
  const phoneId = $secrets.get('WHATSAPP_PHONE_ID')

  if (!token || !phoneId) {
    $app.logger().error('Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_ID for 24h reminders')
    return
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  for (const agendamento of agendamentos) {
    const agendamentoId = agendamento.id

    try {
      const existing = $app.findFirstRecordByFilter(
        'reminders',
        `agendamento_id = '${agendamentoId}' && tipo = '24h' && status = 'enviado'`,
      )
      if (existing) continue
    } catch (_) {}

    const phone = agendamento.getString('cliente_telefone')
    const dataRaw = agendamento.getString('data')

    if (!phone || !phone.match(/\d{10,}/)) {
      try {
        const logsCol = $app.findCollectionByNameOrId('whatsapp_logs')
        const logRec = new Record(logsCol)
        logRec.set('booking_id', agendamentoId)
        logRec.set('phone_number', phone || '')
        logRec.set('message_text', '24h Reminder')
        logRec.set('status', 'skipped')
        logRec.set('error_message', 'Número de telefone inválido ou ausente')
        $app.save(logRec)
      } catch (err) {
        $app.logger().error('Failed to save whatsapp_log', 'error', err.message)
      }
      continue
    }

    let servicoNome = 'Serviço'
    try {
      const servico = $app.findRecordById('servicos', agendamento.getString('servico_id'))
      servicoNome = servico.getString('nome')
    } catch (_) {}

    let dataStr = dataRaw
    let horaStr = ''
    try {
      const d = new Date(dataRaw)
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

    const messageText = `Olá! Lembrete: Seu agendamento de ${servicoNome} está marcado para amanhã, ${dataStr}, às ${horaStr}. Nos vemos em breve!`
    const cleanPhone = phone.replace(/\D/g, '')
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`
    const payload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body: messageText },
    }

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

    let attempt = 1
    let success = false
    let lastError = ''

    while (attempt <= 2 && !success) {
      const res = sendMsg()

      if (res.statusCode >= 200 && res.statusCode < 300) {
        success = true
      } else {
        lastError =
          res.error ||
          `HTTP ${res.statusCode}: ${res.json ? JSON.stringify(res.json) : 'Unknown error'}`

        if (res.statusCode === 401) {
          break
        }

        if (attempt === 1) {
          if (res.statusCode === 429) {
            await sleep(60000)
          } else {
            await sleep(5000)
          }
        }
      }
      attempt++
    }

    try {
      const logsCol = $app.findCollectionByNameOrId('whatsapp_logs')
      const logRec = new Record(logsCol)
      logRec.set('booking_id', agendamentoId)
      logRec.set('phone_number', phone || '')
      logRec.set('message_text', messageText)
      logRec.set('status', success ? 'sent' : 'failed')
      if (lastError && !success) logRec.set('error_message', String(lastError))
      $app.save(logRec)
    } catch (err) {
      $app.logger().error('Failed to save whatsapp_log', 'error', err.message)
    }

    if (success) {
      try {
        let reminderRec
        try {
          reminderRec = $app.findFirstRecordByFilter(
            'reminders',
            `agendamento_id = '${agendamentoId}' && tipo = '24h'`,
          )
        } catch (_) {
          const remindersCol = $app.findCollectionByNameOrId('reminders')
          reminderRec = new Record(remindersCol)
          reminderRec.set('agendamento_id', agendamentoId)
          reminderRec.set('tipo', '24h')
        }
        reminderRec.set('status', 'enviado')
        reminderRec.set('data_agendamento', dataRaw)
        $app.save(reminderRec)
      } catch (err) {
        $app.logger().error('Failed to save reminder', 'error', err.message)
      }
    }
  }
})
