migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId('_pb_users_auth_')

    const plansCollection = new Collection({
      name: 'plans',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'limite_profissionais', type: 'number', required: true },
        { name: 'preco_mensal', type: 'number', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(plansCollection)

    const subscriptionsCollection = new Collection({
      name: 'subscriptions',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: usersCollection.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'plan_id',
          type: 'relation',
          required: true,
          collectionId: plansCollection.id,
          maxSelect: 1,
        },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_proxima_cobranca', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'cancelado', 'vencido'],
          maxSelect: 1,
        },
        { name: 'metodo_pagamento', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(subscriptionsCollection)

    // Seed plans
    const plansData = [
      {
        nome: 'Básico',
        limite_profissionais: 1,
        preco_mensal: 0,
        ativo: true,
        descricao: 'Ideal para começar seu negócio sozinho.',
      },
      {
        nome: 'Starter',
        limite_profissionais: 3,
        preco_mensal: 49.9,
        ativo: true,
        descricao: 'Para pequenas equipes em crescimento.',
      },
      {
        nome: 'Profissional',
        limite_profissionais: 6,
        preco_mensal: 89.9,
        ativo: true,
        descricao: 'O plano mais popular para clínicas.',
      },
      {
        nome: 'Premium',
        limite_profissionais: 10,
        preco_mensal: 149.9,
        ativo: true,
        descricao: 'Para clínicas consolidadas no mercado.',
      },
      {
        nome: 'Enterprise',
        limite_profissionais: 9999,
        preco_mensal: 299.9,
        ativo: true,
        descricao: 'Sem limites. Para grandes operações.',
      },
    ]

    let basicoId = null

    for (const p of plansData) {
      const record = new Record(plansCollection)
      record.set('nome', p.nome)
      record.set('limite_profissionais', p.limite_profissionais)
      record.set('preco_mensal', p.preco_mensal)
      record.set('descricao', p.descricao)
      record.set('ativo', p.ativo)
      app.save(record)
      if (p.nome === 'Básico') basicoId = record.id
    }

    // Seed subscriptions for existing owners
    const owners = app.findRecordsByFilter('_pb_users_auth_', "tipo = 'proprietario'", '', 0, 0)
    for (const owner of owners) {
      try {
        const sub = new Record(subscriptionsCollection)
        sub.set('user_id', owner.id)
        sub.set('plan_id', basicoId)
        sub.set('status', 'ativo')
        sub.set('data_inicio', new Date().toISOString())
        app.save(sub)
      } catch (e) {
        console.log('Error seeding sub for owner:', owner.id, e.message)
      }
    }
  },
  (app) => {
    try {
      const subs = app.findCollectionByNameOrId('subscriptions')
      app.delete(subs)
    } catch (e) {}
    try {
      const plans = app.findCollectionByNameOrId('plans')
      app.delete(plans)
    } catch (e) {}
  },
)
