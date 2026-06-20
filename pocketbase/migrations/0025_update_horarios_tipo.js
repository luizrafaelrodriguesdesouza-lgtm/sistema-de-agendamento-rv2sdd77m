migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('horarios_disponiveis')
    col.fields.add(
      new SelectField({
        name: 'tipo',
        values: ['recorrente', 'especifico', 'bloqueio'],
        required: false,
      }),
    )
    col.fields.add(new DateField({ name: 'data', required: false }))
    col.fields.add(new TextField({ name: 'motivo', required: false }))

    col.createRule =
      "@request.auth.id != '' && (profissional_id = @request.auth.id || profissional_id.proprietario_id = @request.auth.id || @request.auth.tipo = 'master')"
    col.updateRule =
      "@request.auth.id != '' && (profissional_id = @request.auth.id || profissional_id.proprietario_id = @request.auth.id || @request.auth.tipo = 'master')"
    col.deleteRule =
      "@request.auth.id != '' && (profissional_id = @request.auth.id || profissional_id.proprietario_id = @request.auth.id || @request.auth.tipo = 'master')"

    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE horarios_disponiveis SET tipo = 'recorrente' WHERE tipo IS NULL OR tipo = ''",
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('horarios_disponiveis')
    col.fields.removeByName('tipo')
    col.fields.removeByName('data')
    col.fields.removeByName('motivo')

    col.createRule = "@request.auth.id != '' && profissional_id = @request.auth.id"
    col.updateRule = "@request.auth.id != '' && profissional_id = @request.auth.id"
    col.deleteRule = "@request.auth.id != '' && profissional_id = @request.auth.id"

    app.save(col)
  },
)
