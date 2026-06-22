routerAdd('GET', '/backend/v1/tracking/{reference}', (e) => {
  try {
    const reference = e.request.pathValue('reference')
    const record = $app.findFirstRecordByData('agendamentos', 'referencia', reference)

    $app.expandRecord(record, ['servico_id', 'profissional_id', 'cliente_id'])

    return e.json(200, record)
  } catch (err) {
    return e.notFoundError('Agendamento não encontrado')
  }
})
