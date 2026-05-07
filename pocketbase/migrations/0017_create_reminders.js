migrate(
  (app) => {
    const collection = new Collection({
      name: 'reminders',
      type: 'base',
      listRule: "@request.auth.tipo = 'master' || @request.auth.tipo = 'proprietario'",
      viewRule: "@request.auth.tipo = 'master' || @request.auth.tipo = 'proprietario'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'agendamento_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('agendamentos').id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['confirmacao', '24h', '1h'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'enviado', 'falha'],
          maxSelect: 1,
        },
        { name: 'tentativas', type: 'number', required: false },
        { name: 'data_agendamento', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_reminders_status ON reminders (status)',
        'CREATE INDEX idx_reminders_data ON reminders (data_agendamento)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('reminders')
    app.delete(collection)
  },
)
