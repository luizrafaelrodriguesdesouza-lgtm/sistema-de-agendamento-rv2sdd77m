migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Seed Dono
    let ownerId
    try {
      const owner = app.findAuthRecordByEmail('_pb_users_auth_', 'dono@clinica.com')
      ownerId = owner.id
    } catch (_) {
      const record = new Record(users)
      record.setEmail('dono@clinica.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Dono da Clínica')
      record.set('tipo', 'proprietario')
      record.set('status_aprovacao', 'aprovado')
      record.set('empresa', 'Clínica Bem Estar')
      record.set('cnpj', '12.345.678/0001-90')
      app.save(record)
      ownerId = record.id
    }

    // Seed Profissional
    let profId
    try {
      const prof = app.findAuthRecordByEmail('_pb_users_auth_', 'prof@clinica.com')
      profId = prof.id
    } catch (_) {
      const record = new Record(users)
      record.setEmail('prof@clinica.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Dra. Ana Silva')
      record.set('tipo', 'profissional')
      record.set('status_aprovacao', 'aprovado')
      record.set('bio', 'Especialista em estética facial e cuidado avançado.')
      record.set('especialidades', 'Estética Facial,Limpeza de Pele')
      record.set('comissao', 40)
      record.set('proprietario_id', ownerId)
      app.save(record)
      profId = record.id
    }

    // Seed Serviços
    const servicos = app.findCollectionByNameOrId('servicos')
    try {
      app.findFirstRecordByData('servicos', 'nome', 'Limpeza de Pele')
    } catch (_) {
      const s1 = new Record(servicos)
      s1.set('nome', 'Limpeza de Pele')
      s1.set('descricao', 'Limpeza profunda com hidratação')
      s1.set('preco', 150)
      s1.set('duracao', 60)
      s1.set('ativo', true)
      s1.set('profissional_id', profId)
      app.save(s1)

      const s2 = new Record(servicos)
      s2.set('nome', 'Peeling Químico')
      s2.set('descricao', 'Renovação celular e clareamento')
      s2.set('preco', 200)
      s2.set('duracao', 60)
      s2.set('ativo', true)
      s2.set('profissional_id', profId)
      app.save(s2)
    }

    // Seed Horários
    const horarios = app.findCollectionByNameOrId('horarios_disponiveis')
    try {
      app.findFirstRecordByData('horarios_disponiveis', 'profissional_id', profId)
    } catch (_) {
      for (let i = 1; i <= 5; i++) {
        const h = new Record(horarios)
        h.set('profissional_id', profId)
        h.set('dia_semana', i)
        h.set('hora_inicio', '09:00')
        h.set('hora_fim', '18:00')
        app.save(h)
      }
    }
  },
  (app) => {
    // Revertido sem dados caso necessário
  },
)
