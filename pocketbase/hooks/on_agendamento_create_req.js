onRecordAfterCreateRequest((e) => {
  const agendamento = e.record
  const remindersCol = $app.findCollectionByNameOrId('reminders')

  // Confirmação
  const rConf = new Record(remindersCol)
  rConf.set('agendamento_id', agendamento.id)
  rConf.set('tipo', 'confirmacao')
  rConf.set('status', 'pendente')
  rConf.set('tentativas', 0)
  rConf.set('data_agendamento', agendamento.getString('data'))
  $app.save(rConf)

  // 24h
  const r24 = new Record(remindersCol)
  r24.set('agendamento_id', agendamento.id)
  r24.set('tipo', '24h')
  r24.set('status', 'pendente')
  r24.set('tentativas', 0)
  r24.set('data_agendamento', agendamento.getString('data'))
  $app.save(r24)

  // 1h
  const r1 = new Record(remindersCol)
  r1.set('agendamento_id', agendamento.id)
  r1.set('tipo', '1h')
  r1.set('status', 'pendente')
  r1.set('tentativas', 0)
  r1.set('data_agendamento', agendamento.getString('data'))
  $app.save(r1)

  e.next()
}, 'agendamentos')
