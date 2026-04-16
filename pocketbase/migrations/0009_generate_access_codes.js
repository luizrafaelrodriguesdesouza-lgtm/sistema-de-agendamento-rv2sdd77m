migrate(
  (app) => {
    const users = app.findRecordsByFilter(
      'users',
      "tipo = 'proprietario' && codigo_acesso = ''",
      '',
      0,
      0,
    )
    for (const user of users) {
      user.set('codigo_acesso', $security.randomString(6).toUpperCase())
      app.saveNoValidate(user)
    }
  },
  (app) => {
    // no-op
  },
)
