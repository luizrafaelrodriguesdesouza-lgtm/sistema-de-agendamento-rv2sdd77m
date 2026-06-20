migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('servicos')

    if (!col.fields.getByName('foto')) {
      col.fields.add(
        new FileField({
          name: 'foto',
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('servicos')
    col.fields.removeByName('foto')
    app.save(col)
  },
)
