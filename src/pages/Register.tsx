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

export default function Register() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('cliente')
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault()
    toast({ title: 'Cadastro realizado com sucesso!' })
    if (role === 'cliente') navigate('/login')
    else navigate('/pendente')
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
                  <Input required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" required className="h-12" />
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
                      <Input required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input required className="h-12" />
                    </div>
                  </>
                )}
                {role === 'profissional' && (
                  <>
                    <div className="space-y-2">
                      <Label>Bio (Resumo Profissional)</Label>
                      <Input required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Especialidades</Label>
                      <Input placeholder="Ex: Estética, Massagem" required className="h-12" />
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
                  <Button type="submit" className="flex-1 h-12">
                    Finalizar Cadastro
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
