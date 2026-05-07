onRecordAfterUpdateSuccess((e) => {
  const originalPlan = e.record.original().getString('plan_id')
  const newPlan = e.record.getString('plan_id')

  if (originalPlan !== newPlan) {
    $app
      .logger()
      .info(
        'Email notification: Plan upgraded',
        'user_id',
        e.record.getString('user_id'),
        'new_plan',
        newPlan,
      )
  }
  return e.next()
}, 'subscriptions')
