import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function PendingApproval() {
  return (
    <div className="container max-w-md py-20 px-4 text-center animate-fade-in flex-1 flex flex-col justify-center">
      <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
        <CardHeader>
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <CardTitle className="text-amber-800 text-xl font-bold">Aprovação Pendente</CardTitle>
        </CardHeader>
        <CardContent className="text-amber-900/80">
          <p className="mb-8">
            Seu cadastro foi recebido e está em análise. Como profissional ou clínica, nossa equipe
            precisa validar seus dados antes de liberar o acesso ao painel.
          </p>
          <Button
            variant="outline"
            asChild
            className="bg-white w-full h-12 border-amber-200 hover:bg-amber-50 hover:text-amber-900"
          >
            <Link to="/">Retornar à Página Inicial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
