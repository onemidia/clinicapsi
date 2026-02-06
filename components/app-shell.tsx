'use client'

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Verifica se a página atual deve exibir a Sidebar
  // Essa lógica deve estar sincronizada com a do componente Sidebar para evitar desalinhamneto
  const hideSidebar = pathname === '/' || pathname === '/login' || pathname?.startsWith('/portal') || pathname === '/planos' || pathname === '/checkout'

  return (
    <div className="relative min-h-screen bg-slate-50">
      <Sidebar />
      <main className={`transition-all duration-300 ease-in-out ${!hideSidebar ? 'md:ml-64' : 'w-full'}`}>
        {children}
      </main>
    </div>
  )
}