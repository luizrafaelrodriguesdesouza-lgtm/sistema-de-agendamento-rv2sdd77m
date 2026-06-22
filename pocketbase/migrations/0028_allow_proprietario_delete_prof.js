migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.deleteRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || (@request.auth.tipo = 'proprietario' && proprietario_id = @request.auth.id)"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.deleteRule = "@request.auth.tipo = 'master' || id = @request.auth.id"
    app.save(col)
  },
)
