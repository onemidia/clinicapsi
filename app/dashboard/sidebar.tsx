'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, CreditCard, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Agenda", href: "/agenda" },
  { icon: Users, label: "Pacientes", href: "/pacientes" },
  { icon: CreditCard, label: "Financeiro", href: "/financeiro" },
]

export function Sidebar() {
  const pathname = usePathname()

  // Não exibir a sidebar no Portal do Paciente ou páginas públicas
  if (pathname.startsWith('/portal')) {
    return null
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white fixed left-0 top-0 z-10 hidden md:flex">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-semibold text-teal-600 flex items-center gap-2 tracking-tight">
          MentePsi <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">v4</span>
        </h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-teal-50 text-teal-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50">
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  )
}