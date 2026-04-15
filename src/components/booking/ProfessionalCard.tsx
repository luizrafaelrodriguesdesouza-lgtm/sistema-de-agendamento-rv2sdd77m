import { Professional } from '@/stores/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export function ProfessionalCard({ prof, onSelect }: { prof: Professional; onSelect: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:-translate-y-1 hover:shadow-elevation transition-all duration-300 border-2 border-transparent hover:border-primary/50"
      onClick={onSelect}
    >
      <CardContent className="p-6 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
        <Avatar className="h-20 w-20 shadow-sm">
          <AvatarImage src={prof.photo} />
          <AvatarFallback>{prof.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-800">{prof.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{prof.bio}</p>
          <div className="flex gap-2 mt-3 flex-wrap justify-center md:justify-start">
            {prof.specialties.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/20"
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
