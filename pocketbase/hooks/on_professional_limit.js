onRecordCreateRequest((e) => {
  const body = e.requestInfo().body || {}
  if (body.tipo !== 'profissional') return e.next()

  const ownerId = body.proprietario_id
  if (!ownerId) return e.next()

  try {
    const sub = $app.findFirstRecordByFilter('subscriptions', `user_id = {:ownerId}`, { ownerId })
    $app.expandRecord(sub, ['plan_id'], null)
    const plan = sub.expandedOne('plan_id')
    if (!plan) return e.next()

    const limit = plan.getInt('limite_profissionais')
    const count = $app.countRecords(
      'users',
      `tipo = 'profissional' && proprietario_id = {:ownerId}`,
      { ownerId },
    )

    if (count >= limit) {
      throw new BadRequestError(
        'Limite de profissionais atingido. Faça upgrade do seu plano para adicionar mais.',
      )
    }
  } catch (err) {
    if (err.message.includes('Limite de profissionais atingido')) {
      throw err
    }
  }

  return e.next()
}, 'users')
