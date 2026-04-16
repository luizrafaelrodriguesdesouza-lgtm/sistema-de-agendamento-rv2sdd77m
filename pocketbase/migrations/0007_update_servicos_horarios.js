migrate(
  (app) => {
    const servicos = app.findCollectionByNameOrId('servicos')

    const profField = servicos.fields.getByName('profissional_id')
    if (profField) {
      profField.required = false
      servicos.fields.add(profField)
    }

    if (!servicos.fields.getByName('proprietario_id')) {
      servicos.fields.add(
        new RelationField({
          name: 'proprietario_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }

    servicos.createRule =
      "@request.auth.id != '' && (proprietario_id = @request.auth.id || profissional_id = @request.auth.id)"
    servicos.updateRule =
      "@request.auth.id != '' && (proprietario_id = @request.auth.id || profissional_id = @request.auth.id)"
    servicos.deleteRule =
      "@request.auth.id != '' && (proprietario_id = @request.auth.id || profissional_id = @request.auth.id)"

    app.save(servicos)

    const horarios = app.findCollectionByNameOrId('horarios_disponiveis')
    horarios.createRule = "@request.auth.id != '' && profissional_id = @request.auth.id"
    horarios.updateRule = "@request.auth.id != '' && profissional_id = @request.auth.id"
    horarios.deleteRule = "@request.auth.id != '' && profissional_id = @request.auth.id"

    app.save(horarios)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.updateRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || (@request.auth.tipo = 'proprietario' && proprietario_id = @request.auth.id)"
    users.listRule =
      "@request.auth.tipo = 'master' || id = @request.auth.id || proprietario_id = @request.auth.id || id = @request.auth.proprietario_id"
    app.save(users)
  },
  (app) => {
    const servicos = app.findCollectionByNameOrId('servicos')

    const profField = servicos.fields.getByName('profissional_id')
    if (profField) {
      profField.required = true
      servicos.fields.add(profField)
    }

    servicos.fields.removeByName('proprietario_id')

    servicos.createRule = "@request.auth.id != ''"
    servicos.updateRule = "@request.auth.id != ''"
    servicos.deleteRule = "@request.auth.id != ''"
    app.save(servicos)

    const horarios = app.findCollectionByNameOrId('horarios_disponiveis')
    horarios.createRule = "@request.auth.id != ''"
    horarios.updateRule = "@request.auth.id != ''"
    horarios.deleteRule = "@request.auth.id != ''"
    app.save(horarios)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.updateRule = "@request.auth.tipo = 'master' || id = @request.auth.id"
    users.listRule = "@request.auth.tipo = 'master' || id = @request.auth.id"
    app.save(users)
  },
)
