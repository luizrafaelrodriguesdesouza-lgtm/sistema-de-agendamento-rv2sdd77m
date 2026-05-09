migrate(
  (app) => {
    const collection = new Collection({
      name: 'whatsapp_logs',
      type: 'base',
      listRule: "@request.auth.tipo = 'master'",
      viewRule: "@request.auth.tipo = 'master'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'booking_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('agendamentos').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'phone_number', type: 'text' },
        { name: 'message_text', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['sent', 'failed', 'skipped'],
          maxSelect: 1,
        },
        { name: 'error_message', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('whatsapp_logs')
    app.delete(collection)
  },
)
