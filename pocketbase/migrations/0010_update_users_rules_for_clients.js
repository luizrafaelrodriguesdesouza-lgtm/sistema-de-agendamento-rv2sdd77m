migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Allow authenticated users to view owners and professionals for booking
    users.listRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || proprietario_id = @request.auth.id || id = @request.auth.proprietario_id || tipo = 'proprietario' || tipo = 'profissional'"
    users.viewRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || tipo = 'proprietario' || tipo = 'profissional'"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.listRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || proprietario_id = @request.auth.id || id = @request.auth.proprietario_id"
    users.viewRule = "@request.auth.tipo = 'master' || id = @request.auth.id"

    app.save(users)
  },
)
