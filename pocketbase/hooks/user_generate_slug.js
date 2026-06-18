onRecordValidate((e) => {
  const tipo = e.record.getString('tipo')
  if (tipo !== 'proprietario' && tipo !== 'profissional') return e.next()

  let slug = e.record.getString('slug')

  if (slug && e.record.id && slug === e.record.original().getString('slug')) {
    return e.next()
  }

  let base = slug || e.record.getString('empresa') || e.record.getString('name') || 'user'
  let cleanSlug = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!cleanSlug) {
    cleanSlug =
      'user-' + $security.randomStringWithAlphabet(6, 'abcdefghijklmnopqrstuvwxyz0123456789')
  }

  let finalSlug = cleanSlug
  let attempts = 0
  while (attempts < 20) {
    try {
      const existing = $app.findFirstRecordByData('users', 'slug', finalSlug)
      if (existing.id === e.record.id) break
      finalSlug = cleanSlug + '-' + $security.randomStringWithAlphabet(3, '0123456789')
    } catch (_) {
      break
    }
    attempts++
  }

  e.record.set('slug', finalSlug)
  return e.next()
}, 'users')
