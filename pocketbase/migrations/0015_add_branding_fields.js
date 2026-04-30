migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('logo')) {
      users.fields.add(
        new FileField({
          name: 'logo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
        }),
      )
    }

    if (!users.fields.getByName('cor_tema')) {
      users.fields.add(new TextField({ name: 'cor_tema' }))
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('logo')
    users.fields.removeByName('cor_tema')
    app.save(users)
  },
)
