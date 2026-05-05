import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useMasterStore from '@/stores/useMasterStore'
import pb from '@/lib/pocketbase/client'

export function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { selectedOwnerId, setSelectedOwnerId } = useMasterStore()
  const [owners, setOwners] = useState<any[]>([])
  const [searchParams] = useSearchParams()
  const salao = searchParams.get('salao')

  const loginUrl = salao ? `/login?salao=${salao}` : '/login'
  const registerUrl = salao ? `/cadastro?salao=${salao}` : '/cadastro'

  useEffect(() => {
    if (user?.tipo === 'master') {
      pb.collection('users')
        .getFullList({ filter: "tipo = 'proprietario'" })
        .then(setOwners)
        .catch(console.error)
    }
  }, [user])

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold">E</span>
          </div>
          <span className="text-xl font-bold text-primary">EstéticaPro</span>
        </Link>
        <div className="flex items-center gap-4">
          {user?.tipo === 'master' && (
            <Select
              value={selectedOwnerId || 'all'}
              onValueChange={(v) => setSelectedOwnerId(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Todas as Clínicas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Clínicas</SelectItem>
                {owners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.empresa || o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {user ? (
            <>
              <span className="hidden md:inline text-sm text-muted-foreground">
                Olá, {user.name}
              </span>
              <Button variant="ghost" onClick={handleLogout}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to={loginUrl}>Entrar</Link>
              </Button>
              <Button asChild className="rounded-full shadow-elevation">
                <Link to={registerUrl}>Cadastrar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
