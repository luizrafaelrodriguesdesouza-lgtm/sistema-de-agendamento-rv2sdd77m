migrate(
  (app) => {
    const settings = app.findCollectionByNameOrId('settings')
    settings.fields.add(new TextField({ name: 'webhook_secret' }))
    app.save(settings)

    const agendamentos = app.findCollectionByNameOrId('agendamentos')
    agendamentos.fields.add(new BoolField({ name: 'webhook_failed' }))
    app.save(agendamentos)
  },
  (app) => {
    const settings = app.findCollectionByNameOrId('settings')
    settings.fields.removeByName('webhook_secret')
    app.save(settings)

    const agendamentos = app.findCollectionByNameOrId('agendamentos')
    agendamentos.fields.removeByName('webhook_failed')
    app.save(agendamentos)
  },
)
