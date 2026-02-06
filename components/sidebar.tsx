'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, CreditCard, LogOut, FileText, Settings, DollarSign, ShieldCheck, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from '@/lib/client'
import { useEffect, useState } from 'react'

const professionalItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Agenda", href: "/agenda" },
  { icon: Users, label: "Pacientes", href: "/pacientes" },
  { icon: LayoutDashboard, label: "Portal do Cliente", href: "/portal" },
  { icon: FileText, label: "Documentos", href: "/documentos" },
  { icon: CreditCard, label: "Financeiro", href: "/financeiro" },
]

const adminItems = [
  { icon: LayoutDashboard, label: "Dashboard Master", href: "/admin" },
  { icon: Users, label: "Gestão de Psicólogos", href: "/admin/users" },
  { icon: Activity, label: "Assinaturas", href: "/admin/assinaturas" },
  { icon: ShieldCheck, label: "Configurações do SaaS", href: "/admin/configuracoes" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        setUserName(user.user_metadata?.full_name || "Administrador")
        
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', user.id) // CORRIGIDO: de user_id para id
          .single()
        setRole(data?.role || 'professional')
      }
    }
    fetchRole()
  }, [])

  // 1. Não exibir a sidebar no Login ou Portal do Paciente
  if (pathname === '/' || pathname === '/login' || pathname?.startsWith('/portal')) {
    return null
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // 2. Define os itens baseando-se na ROTA atual (para feedback imediato) 
  // e valida com a ROLE do banco de dados
  const isAdminRoute = pathname?.startsWith('/admin')
  const items = isAdminRoute ? adminItems : professionalItems

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white fixed left-0 top-0 z-10 hidden md:flex">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-semibold text-teal-600 flex items-center gap-2 tracking-tight">
          MentePsi <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">Admin</span>
        </h1>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const isActive = item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t p-4 space-y-4">
        {/* Perfil do Usuário */}
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9 border border-slate-200">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} />
            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
        </div>
        
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50 h-9" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  )
}