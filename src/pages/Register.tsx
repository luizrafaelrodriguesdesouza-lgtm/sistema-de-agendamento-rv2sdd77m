import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Register() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('cliente')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [empresa, setEmpresa] = useState('')
  const [cnpj, setCnpj] = useState('')

  const [bio, setBio] = useState('')
  const [especialidades, setEspecialidades] = useState('')
  const [codigoAcesso, setCodigoAcesso] = useState('')
  const [ownerInfo, setOwnerInfo] = useState<{ id: string; empresa: string } | null>(null)
  const [validatingCode, setValidatingCode] = useState(false)

  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { toast } = useToast()

  const handleValidateCode = async () => {
    if (!codigoAcesso) return
    setValidatingCode(true)
    try {
      const res = await pb.send(`/backend/v1/validate-code/${codigoAcesso}`, { method: 'GET' })
      setOwnerInfo(res)
      toast({ title: 'Código válido!', description: `Clínica: ${res.empresa}` })
    } catch (err: any) {
      setOwnerInfo(null)
      toast({
        title: 'Código inválido',
        description: 'Verifique o código e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setValidatingCode(false)
    }
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'profissional' && !ownerInfo) {
      toast({
        title: 'Atenção',
        description: 'Valide o código da clínica antes de prosseguir.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
        tipo: role,
        status_aprovacao: role === 'cliente' ? 'aprovado' : 'pendente',
        empresa: role === 'proprietario' ? empresa : '',
        cnpj: role === 'proprietario' ? cnpj : '',
        bio: role === 'profissional' ? bio : '',
        especialidades: role === 'profissional' ? especialidades : '',
        proprietario_id: role === 'profissional' ? ownerInfo?.id : '',
      })

      if (role === 'cliente' || role === 'profissional') {
        await pb.collection('users').authWithPassword(email, password)
      }

      toast({ title: 'Cadastro realizado com sucesso!' })
      if (role === 'cliente') navigate('/meus-agendamentos')
      else if (role === 'profissional') navigate('/dashboard/profissional/servicos')
      else navigate('/pendente')
    } catch (err: any) {
      toast({
        title: 'Erro ao cadastrar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-md py-20 px-4 animate-fade-in-up flex-1 flex flex-col justify-center">
      <Card className="shadow-elevation border-0">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Passo {step} de 2</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={
              step === 2
                ? handleFinish
                : (e) => {
                    e.preventDefault()
                    setStep(2)
                  }
            }
            className="space-y-5"
          >
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qual é o seu perfil?</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Sou Cliente</SelectItem>
                      <SelectItem value="profissional">Sou Profissional Especialista</SelectItem>
                      <SelectItem value="proprietario">Sou Dono de Clínica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full h-12 mt-2">
                  Continuar
                </Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                {role === 'proprietario' && (
                  <>
                    <div className="space-y-2">
                      <Label>Nome da Clínica/Empresa</Label>
                      <Input
                        required
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input
                        required
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </>
                )}
                {role === 'profissional' && (
                  <>
                    <div className="space-y-2">
                      <Label>Código da Clínica</Label>
                      <div className="flex gap-2">
                        <Input
                          required
                          placeholder="Ex: A1B2C3"
                          value={codigoAcesso}
                          onChange={(e) => setCodigoAcesso(e.target.value)}
                          className="h-12 uppercase"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-12"
                          onClick={handleValidateCode}
                          disabled={validatingCode || !codigoAcesso}
                        >
                          {validatingCode ? '...' : 'Validar'}
                        </Button>
                      </div>
                      {ownerInfo && (
                        <p className="text-sm text-emerald-600 font-medium">
                          ✓ Vinculado a: {ownerInfo.empresa}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Bio (Resumo Profissional)</Label>
                      <Input
                        required
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Especialidades</Label>
                      <Input
                        placeholder="Ex: Estética, Massagem"
                        required
                        value={especialidades}
                        onChange={(e) => setEspecialidades(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </>
                )}
                {role === 'cliente' && (
                  <div className="py-6 text-center text-slate-500 font-medium">
                    Tudo pronto para finalizar!
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setStep(1)}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 h-12">
                    {loading ? 'Processando...' : 'Finalizar Cadastro'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
