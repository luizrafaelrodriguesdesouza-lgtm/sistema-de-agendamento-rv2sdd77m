migrate(
  (app) => {
    // Update servicos to be public
    const servicos = app.findCollectionByNameOrId('servicos')
    servicos.listRule = ''
    servicos.viewRule = ''
    app.save(servicos)

    // Update agendamentos to allow public creation
    const agendamentos = app.findCollectionByNameOrId('agendamentos')
    agendamentos.createRule = ''

    // Add proprietario_id field to agendamentos if not exists
    if (!agendamentos.fields.getByName('proprietario_id')) {
      agendamentos.fields.add(
        new RelationField({
          name: 'proprietario_id',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }
    app.save(agendamentos)

    // Update users to allow finding the owner by slug
    const users = app.findCollectionByNameOrId('users')
    users.listRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || proprietario_id = @request.auth.id || id = @request.auth.proprietario_id || tipo = 'proprietario' || tipo = 'profissional' || slug != ''"
    users.viewRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || tipo = 'proprietario' || tipo = 'profissional' || slug != ''"
    app.save(users)
  },
  (app) => {
    const servicos = app.findCollectionByNameOrId('servicos')
    servicos.listRule = ''
    servicos.viewRule = ''
    app.save(servicos)

    const agendamentos = app.findCollectionByNameOrId('agendamentos')
    agendamentos.createRule = ''
    app.save(agendamentos)

    const users = app.findCollectionByNameOrId('users')
    users.listRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || proprietario_id = @request.auth.id || id = @request.auth.proprietario_id || tipo = 'proprietario' || tipo = 'profissional'"
    users.viewRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || tipo = 'proprietario' || tipo = 'profissional'"
    app.save(users)
  },
)
