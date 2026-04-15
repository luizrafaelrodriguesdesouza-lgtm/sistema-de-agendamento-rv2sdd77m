migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'luizrafaelrodriguesdesouza@gmail.com')
      return // User already exists, skip seeding
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('luizrafaelrodriguesdesouza@gmail.com')
    record.setPassword('LEms1234@!')
    record.setVerified(true)
    record.set('name', 'Master Admin')
    record.set('tipo', 'master')
    record.set('status_aprovacao', 'aprovado')

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'luizrafaelrodriguesdesouza@gmail.com',
      )
      app.delete(record)
    } catch (_) {}
  },
)
