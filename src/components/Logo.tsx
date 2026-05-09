import { cn } from '@/lib/utils'
import logoImg from '@/assets/generatedimage1778295896332-605df.png'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return <img src={logoImg} alt="Agenda+" className={cn('h-8 w-auto object-contain', className)} />
}
