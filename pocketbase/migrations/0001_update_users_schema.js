migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    users.fields.add(
      new SelectField({
        name: 'tipo',
        values: ['cliente', 'profissional', 'proprietario', 'master'],
        maxSelect: 1,
        required: true,
      }),
    )

    users.fields.add(
      new SelectField({
        name: 'status_aprovacao',
        values: ['pendente', 'aprovado', 'rejeitado'],
        maxSelect: 1,
        required: true,
      }),
    )

    users.fields.add(
      new DateField({
        name: 'deleted_at',
      }),
    )

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('tipo')
    users.fields.removeByName('status_aprovacao')
    users.fields.removeByName('deleted_at')
    app.save(users)
  },
)
