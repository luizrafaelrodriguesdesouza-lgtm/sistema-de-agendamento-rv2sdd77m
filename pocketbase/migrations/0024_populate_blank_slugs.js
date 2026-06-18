migrate(
  (app) => {
    const users = app.findRecordsByFilter(
      'users',
      "(tipo = 'proprietario' || tipo = 'profissional') && (slug = '' || slug = null)",
      '',
      0,
      0,
    )

    for (const u of users) {
      let base = u.getString('empresa') || u.getString('name') || 'user-' + u.id
      let slug = base
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!slug) slug = 'user-' + u.id

      let finalSlug = slug
      let attempts = 0
      while (attempts < 20) {
        try {
          const existing = app.findFirstRecordByData('users', 'slug', finalSlug)
          if (existing.id === u.id) break
          finalSlug = slug + '-' + $security.randomStringWithAlphabet(3, '0123456789')
        } catch (_) {
          break
        }
        attempts++
      }

      u.set('slug', finalSlug)
      app.saveNoValidate(u)
    }
  },
  (app) => {},
)
