migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    collection.deleteRule = "@request.auth.tipo = 'master' || id = @request.auth.id"
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    collection.deleteRule = 'id = @request.auth.id'
    app.save(collection)
  },
)
