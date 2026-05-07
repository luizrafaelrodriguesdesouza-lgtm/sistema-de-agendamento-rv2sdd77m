onRecordValidate((e) => {
  if (
    e.record.isNew() &&
    (!e.record.getString('status') || e.record.getString('status') === 'pendente')
  ) {
    e.record.set('status', 'confirmado')
  }
  return e.next()
}, 'agendamentos')
