routerAdd(
  'POST',
  '/backend/v1/checkout',
  (e) => {
    const body = e.requestInfo().body || {}
    const planId = body.plan_id
    if (!planId) return e.badRequestError('Plan ID required')

    const authRecord = e.auth
    if (!authRecord) return e.unauthorizedError('Auth required')

    let sub
    try {
      sub = $app.findFirstRecordByFilter('subscriptions', `user_id = {:userId}`, {
        userId: authRecord.id,
      })
    } catch (err) {
      const subCol = $app.findCollectionByNameOrId('subscriptions')
      sub = new Record(subCol)
      sub.set('user_id', authRecord.id)
    }

    sub.set('plan_id', planId)
    sub.set('status', 'ativo')
    sub.set('data_inicio', new Date().toISOString())

    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    sub.set('data_proxima_cobranca', nextMonth.toISOString())

    $app.save(sub)

    return e.json(200, { url: '/dono/plano?success=true' })
  },
  $apis.requireAuth(),
)
