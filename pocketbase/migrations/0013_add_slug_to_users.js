migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('slug')) {
      users.fields.add(
        new TextField({
          name: 'slug',
          pattern: '^[a-z0-9-]+$',
        }),
      )
    }

    users.addIndex('idx_users_slug', true, 'slug', "slug != ''")
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.removeIndex('idx_users_slug')
    users.fields.removeByName('slug')
    app.save(users)
  },
)
