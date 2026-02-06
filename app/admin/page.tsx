'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, Activity, DollarSign, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPsychologists: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const PLAN_VALUE = 49.90

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // 1. Total de Psicólogos (role = 'professional')
      const { count: psychologistsCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'professional')

      // 2. Assinaturas Ativas (todos os usuários em user_roles por enquanto)
      const { count: activeCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })

      // 3. Usuários Recentes (usando a view admin_users_view para ter acesso a nome/email)
      const { data: recentData } = await supabase
        .from('admin_users_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalPsychologists: psychologistsCount || 0,
        activeSubscriptions: activeCount || 0,
        monthlyRevenue: (activeCount || 0) * PLAN_VALUE
      })

      if (recentData) {
        setRecentUsers(recentData)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard Master</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Psicólogos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.totalPsychologists}
            </div>
            <p className="text-xs text-muted-foreground">Cadastrados na plataforma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.activeSubscriptions}
            </div>
            <p className="text-xs text-muted-foreground">Usuários ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyRevenue)
              }
            </div>
            <p className="text-xs text-muted-foreground">Estimado (R$ 49,90/user)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos este Mês</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : recentUsers.length}
            </div>
            <p className="text-xs text-muted-foreground">Novos cadastros recentes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Usuários Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell>
                  </TableRow>
                ) : (
                  recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || 'Não informado'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Ativo
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}