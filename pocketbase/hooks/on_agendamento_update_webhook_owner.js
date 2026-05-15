onRecordAfterUpdateSuccess((e) => {
  const agendamento = e.record
  const original = agendamento.original()

  // Only trigger if status changed
  if (agendamento.getString('status') === original.getString('status')) {
    return e.next()
  }

  try {
    const profissionalId = agendamento.getString('profissional_id')
    if (!profissionalId) return e.next()

    const profissional = $app.findRecordById('users', profissionalId)
    const proprietarioId = profissional.getString('proprietario_id') || profissionalId

    const proprietario = $app.findRecordById('users', proprietarioId)
    let webhookUrl = proprietario.getString('webhook_url')

    if (!webhookUrl) return e.next()

    webhookUrl = webhookUrl.trim().replace(/[\n\r\t]/g, '')

    const servicoId = agendamento.getString('servico_id')
    let servico_nome = ''
    let preco = 0
    if (servicoId) {
      try {
        const servico = $app.findRecordById('servicos', servicoId)
        servico_nome = servico.getString('nome')
        preco = servico.get('preco') || 0
      } catch (err) {}
    }

    let cliente_nome = agendamento.getString('cliente_nome')
    let cliente_telefone = agendamento.getString('cliente_telefone')

    const clienteId = agendamento.getString('cliente_id')
    if (clienteId && !cliente_nome) {
      try {
        const cliente = $app.findRecordById('users', clienteId)
        cliente_nome = cliente.getString('name') || cliente_nome
      } catch (err) {}
    }

    let dataFormatada = ''
    let horaFormatada = ''
    const rawData = agendamento.getString('data')
    if (rawData) {
      const parts = rawData.split(' ')
      if (parts.length > 0) dataFormatada = parts[0]
      if (parts.length > 1) horaFormatada = parts[1].substring(0, 5)
    }

    const payload = {
      event: `appointment_status_changed_to_${agendamento.getString('status')}`,
      data: {
        cliente_nome: cliente_nome || '',
        cliente_email: agendamento.getString('cliente_email') || '',
        cliente_telefone: cliente_telefone || '',
        servico: servico_nome || '',
        profissional: profissional.getString('name') || '',
        data: dataFormatada,
        hora: horaFormatada,
        valor: preco,
        referencia: agendamento.getString('referencia') || '',
        status: agendamento.getString('status'),
      },
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
        responseText = '{"raw": "Non-JSON response or empty"}'
      }
    } catch (httpErr) {
      statusCode = 0
      responseText = `Transport error: ${httpErr.message}`
    }

    try {
      const logCol = $app.findCollectionByNameOrId('webhook_logs')
      const logRecord = new Record(logCol)
      logRecord.set('event', 'appointment_status_changed')
      logRecord.set('status', statusCode)
      logRecord.set('payload', Object.assign({}, payload, { request_url: webhookUrl }))
      logRecord.set('response', responseText)
      $app.save(logRecord)
    } catch (err) {
      $app
        .logger()
        .error('Erro ao salvar log do webhook do proprietario (update)', 'error', err.message)
    }
  } catch (err) {
    $app.logger().error('Erro na execucao do owner webhook (update)', 'error', err.message)
  }

  return e.next()
}, 'agendamentos')
