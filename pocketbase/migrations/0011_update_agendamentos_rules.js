migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agendamentos')

    // Tighten list and view rules to ensure only relevant parties can view the appointment details
    col.listRule =
      "@request.auth.id != '' && (cliente_id = @request.auth.id || profissional_id = @request.auth.id || @request.auth.tipo = 'master' || (@request.auth.tipo = 'proprietario' && profissional_id.proprietario_id = @request.auth.id))"
    col.viewRule =
      "@request.auth.id != '' && (cliente_id = @request.auth.id || profissional_id = @request.auth.id || @request.auth.tipo = 'master' || (@request.auth.tipo = 'proprietario' && profissional_id.proprietario_id = @request.auth.id))"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('agendamentos')

    // Revert back to the initial broad access rule
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"

    app.save(col)
  },
)
