import { Card, CardContent } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'

export function ProfessionalCard({ prof, onSelect }: { prof: any; onSelect: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 overflow-hidden group h-full"
      onClick={onSelect}
    >
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4 h-full">
        <div className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl overflow-hidden group-hover:scale-105 transition-transform duration-300 shrink-0">
          {prof.avatar ? (
            <img
              src={pb.files.getURL(prof, prof.avatar)}
              alt={prof.name}
              className="w-full h-full object-cover"
            />
          ) : (
            prof.name?.[0]?.toUpperCase() || 'P'
          )}
        </div>
        <div className="flex flex-col flex-1 w-full">
          <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{prof.name}</h3>
          <p className="text-sm font-medium text-primary mt-1">
            {prof.especialidades ||
              (prof.tipo === 'proprietario' ? 'Proprietário' : 'Profissional')}
          </p>
          {prof.bio && (
            <p className="text-sm text-slate-500 mt-4 line-clamp-4 italic flex-1">"{prof.bio}"</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
