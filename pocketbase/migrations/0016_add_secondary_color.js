migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('cor_secundaria')) {
      col.fields.add(new TextField({ name: 'cor_secundaria' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('cor_secundaria')
    app.save(col)
  },
)
