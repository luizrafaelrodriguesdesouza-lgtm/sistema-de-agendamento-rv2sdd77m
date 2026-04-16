migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new TextField({ name: 'codigo_acesso' }))
    app.save(users)

    users.addIndex('idx_codigo_acesso', true, 'codigo_acesso', "codigo_acesso != ''")
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.removeIndex('idx_codigo_acesso')
    users.fields.removeByName('codigo_acesso')
    app.save(users)
  },
)
