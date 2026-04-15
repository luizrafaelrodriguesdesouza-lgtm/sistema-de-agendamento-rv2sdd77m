migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('motivo_rejeicao')) {
      users.fields.add(new TextField({ name: 'motivo_rejeicao', required: false }))
      app.save(users)
    }

    let settings
    try {
      settings = app.findCollectionByNameOrId('settings')
    } catch (_) {
      settings = new Collection({
        name: 'settings',
        type: 'base',
        listRule: "@request.auth.tipo = 'master'",
        viewRule: "@request.auth.tipo = 'master'",
        createRule: "@request.auth.tipo = 'master'",
        updateRule: "@request.auth.tipo = 'master'",
        deleteRule: null,
        fields: [
          { name: 'webhook_url', type: 'url', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(settings)

      const record = new Record(settings)
      record.set('webhook_url', '')
      app.save(record)
    }

    let webhookLogs
    try {
      webhookLogs = app.findCollectionByNameOrId('webhook_logs')
    } catch (_) {
      webhookLogs = new Collection({
        name: 'webhook_logs',
        type: 'base',
        listRule: "@request.auth.tipo = 'master'",
        viewRule: "@request.auth.tipo = 'master'",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'event', type: 'text', required: true },
          { name: 'status', type: 'number', required: true },
          { name: 'payload', type: 'json', required: false },
          { name: 'response', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(webhookLogs)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('webhook_logs'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('settings'))
    } catch (_) {}
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.fields.removeByName('motivo_rejeicao')
      app.save(users)
    } catch (_) {}
  },
)
