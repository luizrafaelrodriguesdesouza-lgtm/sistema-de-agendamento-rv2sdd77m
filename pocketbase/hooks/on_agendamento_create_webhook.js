onRecordAfterCreateSuccess((e) => {
  const agendamento = e.record

  try {
    const profissionalId = agendamento.getString('profissional_id')
    if (!profissionalId) return e.next()

    const profissional = $app.findRecordById('users', profissionalId)
    const proprietarioId = profissional.getString('proprietario_id') || profissionalId

    const proprietario = $app.findRecordById('users', proprietarioId)
    const webhookUrl = proprietario.getString('webhook_url')

    if (!webhookUrl) return e.next()

    const servicoId = agendamento.getString('servico_id')
    let servico_nome = ''
    let preco = 0
    if (servicoId) {
      try {
        const servico = $app.findRecordById('servicos', servicoId)
        servico_nome = servico.getString('nome')
        preco = servico.get('preco')
      } catch (err) {}
    }

    let cliente_nome = agendamento.getString('cliente_nome')
    let cliente_email = agendamento.getString('cliente_email')
    let cliente_telefone = agendamento.getString('cliente_telefone')

    const clienteId = agendamento.getString('cliente_id')
    if (clienteId && !cliente_nome) {
      try {
        const cliente = $app.findRecordById('users', clienteId)
        cliente_nome = cliente.getString('name') || cliente_nome
        cliente_email = cliente.getString('email') || cliente_email
      } catch (err) {}
    }

    const payload = {
      agendamento_id: agendamento.id,
      cliente_nome: cliente_nome,
      cliente_email: cliente_email,
      cliente_telefone: cliente_telefone,
      servico_nome: servico_nome,
      data_agendamento: agendamento.getString('data'),
      profissional_nome: profissional.getString('name'),
      valor: preco,
      status: agendamento.getString('status'),
    }

    let statusCode = 0
    let responseText = ''

    try {
      const res = $http.send({
        url: webhookUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 15,
      })
      statusCode = res.statusCode
      if (res.json) {
        responseText = JSON.stringify(res.json)
      } else {
        responseText = `Status: ${res.statusCode}`
      }
    } catch (httpErr) {
      statusCode = 0
      responseText = `Transport error: ${httpErr.message}`
    }

    try {
      const logCol = $app.findCollectionByNameOrId('webhook_logs')
      const logRecord = new Record(logCol)
      logRecord.set('event', 'owner_webhook_booking_create')
      logRecord.set('status', statusCode)
      logRecord.set('payload', payload)
      logRecord.set('response', responseText)
      $app.save(logRecord)
    } catch (err) {
      $app.logger().error('Erro ao salvar log do webhook do proprietario', 'error', err.message)
    }
  } catch (err) {
    $app.logger().error('Erro na execucao do owner webhook', 'error', err.message)
  }

  return e.next()
}, 'agendamentos')
