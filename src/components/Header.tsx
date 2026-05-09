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
import { Logo } from '@/components/Logo'

export function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { selectedOwnerId, setSelectedOwnerId } = useMasterStore()
  const [owners, setOwners] = useState<any[]>([])
  const [searchParams] = useSearchParams()
  const salao = searchParams.get('salao')

  const [userSlug, setUserSlug] = useState<string | null>(null)
  const [loadingSlug, setLoadingSlug] = useState(false)

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

  useEffect(() => {
    async function fetchSlug() {
      if (!user) return
      if (user.tipo === 'proprietario' && user.slug) {
        setUserSlug(user.slug)
      } else if (user.tipo === 'profissional' && user.proprietario_id) {
        setLoadingSlug(true)
        try {
          const owner = await pb.collection('users').getOne(user.proprietario_id)
          setUserSlug(owner.slug)
        } catch (e) {
          console.error(e)
        } finally {
          setLoadingSlug(false)
        }
      }
    }
    fetchSlug()
  }, [user])

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center shrink-0">
          <Logo className="h-10" />
        </Link>
        <div className="flex items-center gap-4">
          {(user?.tipo === 'proprietario' || user?.tipo === 'profissional') && (
            <div className="hidden sm:flex items-center justify-center mr-2">
              {loadingSlug ? (
                <div className="h-4 w-24 bg-slate-200 animate-pulse rounded"></div>
              ) : userSlug ? (
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Código: {userSlug}
                </span>
              ) : null}
            </div>
          )}
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
