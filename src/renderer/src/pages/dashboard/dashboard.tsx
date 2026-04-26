import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { ChevronRight, Flame, Gem, Star, Trophy } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

const Dashboard: React.FC = () => {
  return (
    <div className="w-full bg-[linear-gradient(180deg,var(--background)_0%,#dfe8f2_100%)] p-4">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-6">
        <div className="col-span-1 space-y-2 lg:col-span-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Olá! Pronto para subir de nível?</h1>
          <p className="text-sm font-semibold text-muted-foreground">
            Cada aula concluída aproxima você do próximo marco.
          </p>
        </div>
        <div className="col-span-1 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:col-span-4">
          <Card className="yuno-surface yuno-stat-mint p-0">
            <div className="flex items-center gap-3 p-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Trophy className="size-6" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs font-extrabold tracking-wide uppercase">
                  Nível
                </p>
                <p className="text-2xl font-extrabold">1</p>
              </div>
            </div>
          </Card>
          <Card className="yuno-surface yuno-stat-amber p-0">
            <div className="flex items-center gap-3 p-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200/80 text-amber-900">
                <Star className="size-6" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs font-extrabold tracking-wide uppercase">XP</p>
                <p className="text-2xl font-extrabold">0</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4">
          <Card className="yuno-surface col-span-1 sm:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-extrabold">Tarefas do dia</CardTitle>
              <Button variant="link" asChild className="h-auto p-0 text-sm font-extrabold">
                <Link to="/dashboard" className="text-primary flex items-center">
                  Ver tudo
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-muted-foreground">
                Nada aqui ainda — abra os cursos e comece a marcar aulas.
              </p>
            </CardContent>
          </Card>
          <Card className="yuno-surface yuno-stat-sky">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                <Gem className="size-5 text-sky-600" />
                Loja
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-semibold text-muted-foreground">
              Resgate recompensas com suas gemas em breve.
            </CardContent>
          </Card>
          <Card className="yuno-surface yuno-stat-rose">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                <Flame className="size-5 text-orange-600" />
                Ofensiva
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-semibold text-muted-foreground">
              Seu histórico de dias seguidos aparece aqui.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
