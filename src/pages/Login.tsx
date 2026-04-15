import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import useAuthStore from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    let role: any = 'cliente'
    if (email.includes('prof')) role = 'profissional'
    if (email.includes('prop')) role = 'proprietario'
    if (email.includes('master')) role = 'master'

    setUser({ id: 'u1', name: 'Usuário Teste', email, role, status: 'aprovado' })
    toast({ title: 'Bem-vindo de volta!' })

    if (role === 'cliente') navigate('/meus-agendamentos')
    else navigate(`/dashboard/${role}`)
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
                placeholder="exemplo: prop@clinica.com"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Dica: use 'prof', 'prop' ou 'master' no e-mail para testar os painéis.
              </p>
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
              />
            </div>
            <Button type="submit" className="w-full h-12 text-md">
              Entrar
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
