migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('webhook_custom_1')) {
      col.fields.add(new TextField({ name: 'webhook_custom_1' }))
    }
    if (!col.fields.getByName('webhook_custom_2')) {
      col.fields.add(new TextField({ name: 'webhook_custom_2' }))
    }
    if (!col.fields.getByName('webhook_custom_3')) {
      col.fields.add(new TextField({ name: 'webhook_custom_3' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('webhook_custom_1')
    col.fields.removeByName('webhook_custom_2')
    col.fields.removeByName('webhook_custom_3')
    app.save(col)
  },
)
