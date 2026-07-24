type SidebarProps = {
  selectedGroupId?: string
}

export function Sidebar({ selectedGroupId }: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 border-r border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-4 text-lg font-semibold">Cursos</h2>
      {/* busca + lista de grupos/canais */}
      <p className="text-sm text-slate-500">
        {selectedGroupId ? `Selecionado: ${selectedGroupId}` : 'Nenhum grupo selecionado'}
      </p>
    </aside>
  )
}
