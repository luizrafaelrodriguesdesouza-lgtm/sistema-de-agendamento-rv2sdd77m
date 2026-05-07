cronAdd('process_reminders', '*/5 * * * *', () => {
  const now = new Date()
  let reminders = []
  try {
    reminders = $app.findRecordsByFilter('reminders', "status = 'pendente'", 'created', 50, 0)
  } catch (_) {
    return
  }

  for (const r of reminders) {
    const tipo = r.getString('tipo')
    const dataStr = r.getString('data_agendamento')
    if (!dataStr) continue

    const agendamentoDate = new Date(dataStr)
    const diffMs = agendamentoDate.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    let shouldSend = false

    if (tipo === 'confirmacao') shouldSend = true
    else if (tipo === '24h' && diffHours <= 24 && diffHours > 0) shouldSend = true
    else if (tipo === '1h' && diffHours <= 1 && diffHours > 0) shouldSend = true
    else if (diffHours <= 0) {
      r.set('status', 'falha')
      $app.save(r)
      continue
    }

    if (shouldSend) {
      try {
        let agendamento
        try {
          agendamento = $app.findRecordById('agendamentos', r.getString('agendamento_id'))
        } catch (_) {
          r.set('status', 'falha')
          $app.save(r)
          continue
        }

        if (agendamento.getString('status') === 'cancelado') {
          r.set('status', 'falha')
          $app.save(r)
          continue
        }

        $app.expandRecord(agendamento, ['servico_id'])
        const servico = agendamento.expandedOne('servico_id')
        const servicoNome = servico ? servico.getString('nome') : 'Serviço'
        const clienteNome = agendamento.getString('cliente_nome') || 'Cliente'
        const clienteTelefone = agendamento.getString('cliente_telefone')

        const dDate = new Date(agendamento.getString('data'))
        dDate.setHours(dDate.getHours() - 3)
        const dia = String(dDate.getUTCDate()).padStart(2, '0')
        const mes = String(dDate.getUTCMonth() + 1).padStart(2, '0')
        const ano = dDate.getUTCFullYear()
        const horas = String(dDate.getUTCHours()).padStart(2, '0')
        const minutos = String(dDate.getUTCMinutes()).padStart(2, '0')
        const dataFmt = `${dia}/${mes}/${ano}`
        const horaFmt = `${horas}:${minutos}`

        const msg = `Olá ${clienteNome}, seu agendamento em ${servicoNome} dia ${dataFmt} às ${horaFmt} local está confirmado!`
        const apiUrl = $secrets.get('WHATSAPP_API_URL')
        const apiKey = $secrets.get('WHATSAPP_API_KEY')

        if (apiUrl && apiKey && clienteTelefone) {
          const res = $http.send({
            url: apiUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ to: clienteTelefone, text: msg }),
            timeout: 10,
          })

          if (res.statusCode >= 200 && res.statusCode < 300) {
            r.set('status', 'enviado')
          } else {
            throw new Error(`API error ${res.statusCode}`)
          }
        } else {
          $app.logger().info('MOCK WhatsApp', 'to', clienteTelefone, 'msg', msg)
          r.set('status', 'enviado')
        }
        $app.save(r)
      } catch (err) {
        const tentativas = r.getInt('tentativas') + 1
        r.set('tentativas', tentativas)
        if (tentativas >= 3) r.set('status', 'falha')
        $app.save(r)
        $app.logger().error('Failed to send WhatsApp reminder', 'error', err.message)
      }
    }
  }
})
