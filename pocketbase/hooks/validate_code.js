routerAdd('GET', '/backend/v1/validate-code/{code}', (e) => {
  const code = e.request.pathValue('code')
  try {
    const owner = $app.findFirstRecordByData('users', 'codigo_acesso', code)
    if (owner.getString('tipo') !== 'proprietario') {
      throw new Error('User is not an owner')
    }
    return e.json(200, {
      id: owner.id,
      nome: owner.getString('name'),
      empresa: owner.getString('empresa'),
    })
  } catch (_) {
    throw new NotFoundError('Código de clínica inválido')
  }
})
