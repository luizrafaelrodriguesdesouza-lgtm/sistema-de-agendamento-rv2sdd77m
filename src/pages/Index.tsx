import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarRange } from 'lucide-react'

export default function Index() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = code.trim()
    if (!trimmedCode) return

    setLoading(true)
    setError('')

    try {
      const result = await pb
        .collection('users')
        .getFirstListItem(`slug = "${trimmedCode}" && tipo = 'proprietario'`)

      if (result && result.id) {
        navigate(`/booking/${result.id}`)
      }
    } catch (err) {
      console.error(err)
      setError('Código de unidade inválido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] bg-white flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-100">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <CalendarRange className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-slate-800">Agenda+</CardTitle>
          <p className="text-slate-500 mt-2">Acesse a página da unidade</p>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Código da Unidade"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-lg p-6 text-center"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {error && (
                <p className="text-red-500 text-sm text-center font-medium animate-fade-in-up">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 transition-colors duration-200"
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Buscando...</span>
                </div>
              ) : (
                'Acessar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
