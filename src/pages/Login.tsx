import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error, user } = await signIn(email, password)

    setIsLoading(false)

    if (error || !user) {
      toast({
        title: 'Erro ao acessar conta',
        description:
          getErrorMessage(error) || 'Credenciais inválidas. Verifique seu e-mail e senha.',
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Bem-vindo de volta!' })

    if (user.tipo !== 'master' && user.status_aprovacao === 'pendente') {
      navigate('/pendente')
      return
    }

    if (user.tipo !== 'master' && user.status_aprovacao === 'rejeitado') {
      toast({
        title: 'Acesso negado',
        description: 'Sua conta não foi aprovada pelo administrador.',
        variant: 'destructive',
      })
      return
    }

    if (user.tipo === 'cliente') {
      navigate('/meus-agendamentos')
    } else if (user.tipo === 'master') {
      navigate('/admin/dashboard')
    } else {
      navigate(`/dashboard/${user.tipo}`)
    }
  }

  return (
    <div className="container max-w-md py-20 px-4 animate-fade-in-up flex-1 flex flex-col justify-center">
      <Card className="shadow-elevation border-0">
        <CardHeader className="text-center pb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary font-bold text-xl">E</span>
          </div>
          <CardTitle className="text-2xl font-bold">Acessar Conta</CardTitle>
          <CardDescription>Insira suas credenciais para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="h-12"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full h-12 text-md" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-primary font-semibold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
