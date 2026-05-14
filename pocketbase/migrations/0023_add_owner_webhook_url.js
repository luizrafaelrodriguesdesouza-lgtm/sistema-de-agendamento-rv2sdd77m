migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.add(new URLField({ name: 'webhook_url' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('webhook_url')
    app.save(col)
  },
)
