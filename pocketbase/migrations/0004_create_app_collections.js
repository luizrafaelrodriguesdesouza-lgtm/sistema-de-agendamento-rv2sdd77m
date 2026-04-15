migrate(
  (app) => {
    // Atualiza a tabela de usuários
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(new TextField({ name: 'bio' }))
    users.fields.add(new TextField({ name: 'especialidades' }))
    users.fields.add(new TextField({ name: 'cnpj' }))
    users.fields.add(new TextField({ name: 'empresa' }))
    users.fields.add(new NumberField({ name: 'comissao' }))
    users.fields.add(
      new RelationField({ name: 'proprietario_id', collectionId: '_pb_users_auth_', maxSelect: 1 }),
    )
    app.save(users)

    // Cria a tabela de serviços
    const servicos = new Collection({
      name: 'servicos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'preco', type: 'number', required: true },
        { name: 'duracao', type: 'number', required: true },
        { name: 'ativo', type: 'bool' },
        {
          name: 'profissional_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(servicos)

    // Cria a tabela de horários
    const horarios = new Collection({
      name: 'horarios_disponiveis',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'profissional_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'dia_semana', type: 'number', required: true, min: 0, max: 6 },
        { name: 'hora_inicio', type: 'text', required: true },
        { name: 'hora_fim', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(horarios)

    // Cria a tabela de agendamentos
    const agendamentos = new Collection({
      name: 'agendamentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '',
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'cliente_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'cliente_nome', type: 'text', required: false },
        { name: 'cliente_email', type: 'email', required: false },
        { name: 'cliente_telefone', type: 'text', required: false },
        {
          name: 'profissional_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'servico_id',
          type: 'relation',
          required: true,
          collectionId: servicos.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'confirmado', 'cancelado', 'concluido'],
          maxSelect: 1,
        },
        { name: 'referencia', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(agendamentos)
  },
  (app) => {
    const agendamentos = app.findCollectionByNameOrId('agendamentos')
    app.delete(agendamentos)
    const horarios = app.findCollectionByNameOrId('horarios_disponiveis')
    app.delete(horarios)
    const servicos = app.findCollectionByNameOrId('servicos')
    app.delete(servicos)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('bio')
    users.fields.removeByName('especialidades')
    users.fields.removeByName('cnpj')
    users.fields.removeByName('empresa')
    users.fields.removeByName('comissao')
    users.fields.removeByName('proprietario_id')
    app.save(users)
  },
)
