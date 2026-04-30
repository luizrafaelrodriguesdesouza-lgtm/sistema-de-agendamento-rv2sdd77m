migrate(
  (app) => {
    const users = app.findRecordsByFilter(
      'users',
      "tipo = 'proprietario' || tipo = 'profissional'",
      '',
      0,
      0,
    )

    for (const u of users) {
      if (u.getString('slug')) continue

      let base = u.getString('empresa') || u.getString('name') || 'user-' + u.id
      let slug = base
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]/g, '-') // replace non-alphanumeric with dash
        .replace(/-+/g, '-') // remove duplicate dashes
        .replace(/^-|-$/g, '') // trim dashes

      if (!slug) slug = 'user-' + u.id

      let finalSlug = slug
      let counter = 1
      while (true) {
        try {
          const existing = app.findFirstRecordByData('users', 'slug', finalSlug)
          if (existing.id === u.id) break
          finalSlug = `${slug}-${counter}`
          counter++
        } catch (_) {
          break // slug is unique
        }
      }

      u.set('slug', finalSlug)
      app.saveNoValidate(u)
    }
  },
  (app) => {
    // Irreversible
  },
)
