migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('settings')
    if (!col.fields.getByName('buffer_duration')) {
      col.fields.add(new NumberField({ name: 'buffer_duration', min: 0 }))
    }
    app.save(col)

    const appsCol = app.findCollectionByNameOrId('agendamentos')
    appsCol.addIndex('idx_agendamentos_prof_data', false, 'profissional_id, data', '')
    app.save(appsCol)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('settings')
    col.fields.removeByName('buffer_duration')
    app.save(col)

    const appsCol = app.findCollectionByNameOrId('agendamentos')
    appsCol.removeIndex('idx_agendamentos_prof_data')
    app.save(appsCol)
  },
)
