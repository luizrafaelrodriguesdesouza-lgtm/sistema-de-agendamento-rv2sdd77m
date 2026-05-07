onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('tipo') !== 'proprietario') return e.next()

  try {
    const plan = $app.findFirstRecordByData('plans', 'nome', 'Básico')
    const subCol = $app.findCollectionByNameOrId('subscriptions')
    const sub = new Record(subCol)
    sub.set('user_id', e.record.id)
    sub.set('plan_id', plan.id)
    sub.set('status', 'ativo')
    sub.set('data_inicio', new Date().toISOString())
    $app.save(sub)
  } catch (err) {
    $app.logger().error('Error creating default subscription', 'error', err.message)
  }
  return e.next()
}, 'users')
