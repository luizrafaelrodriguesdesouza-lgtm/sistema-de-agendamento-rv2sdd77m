onRecordCreate((e) => {
  if (e.record.getString('tipo') === 'proprietario' && !e.record.getString('codigo_acesso')) {
    e.record.set(
      'codigo_acesso',
      $security.randomStringWithAlphabet(6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
    )
  }
  e.next()
}, 'users')
