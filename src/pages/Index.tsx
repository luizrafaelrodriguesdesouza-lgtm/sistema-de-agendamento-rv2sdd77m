import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BookingFlow } from '@/components/booking/BookingFlow'

export default function Index() {
  const [started, setStarted] = useState(false)

  return (
    <div className="flex-1 py-12 px-4 md:px-8">
      {!started ? (
        <section className="text-center py-20 max-w-4xl mx-auto animate-fade-in-up">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
            Agendamento Rápido e Seguro
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Sua saúde e bem-estar <br className="hidden md:block" /> são nossa prioridade.
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
            Escolha o profissional, o serviço desejado e o melhor horário. Tudo de forma 100%
            online.
          </p>
          <Button
            size="lg"
            className="text-lg px-10 h-14 rounded-full shadow-elevation hover:-translate-y-1 transition-transform"
            onClick={() => setStarted(true)}
          >
            Quero Agendar Agora
          </Button>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">Escolha o Especialista</h3>
              <p className="text-slate-500 text-sm">
                Selecione o profissional que melhor atende às suas necessidades.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">Defina Data e Hora</h3>
              <p className="text-slate-500 text-sm">
                Navegue pela agenda em tempo real e reserve seu momento.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-bold text-lg mb-2">Confirmação Imediata</h3>
              <p className="text-slate-500 text-sm">
                Receba seu código de rastreio e prepare-se para o atendimento.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <BookingFlow onCancel={() => setStarted(false)} />
      )}
    </div>
  )
}
