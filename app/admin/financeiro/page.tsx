'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Download,
  Loader2 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function FinanceiroGlobal() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    monthlyRevenue: 0,
    annualProjection: 0
  })
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [currentPlanValue, setCurrentPlanValue] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetchFinanceData() {
      setLoading(true)
      
      // Busca valor do plano nas configurações
      const { data: settings } = await supabase
        .from('global_settings')
        .select('plan_professional')
        .single()

      const planPrice = settings?.plan_professional ? Number(settings.plan_professional) : 49.90
      setCurrentPlanValue(planPrice)

      // Busca total de psicólogos ativos para calcular faturamento
      const { count } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'professional')
        .eq('status', 'active')

      // Busca os nomes dos últimos pagamentos (usando nossa view)
      const { data: payments } = await supabase
        .from('admin_users_view')
        .select('full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      const total = count || 0
      setStats({
        totalUsers: total,
        monthlyRevenue: total * planPrice,
        annualProjection: (total * planPrice) * 12
      })

      if (payments) setRecentPayments(payments)
      setLoading(false)
    }

    fetchFinanceData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Financeiro Global</h1>
          <p className="text-slate-500">Gestão de receitas e assinaturas do SaaS.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Download className="mr-2 h-4 w-4" /> Exportar Relatório
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Faturamento Mensal (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-emerald-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> Crescimento real
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Projeção Anual (ARR)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : formatCurrency(stats.annualProjection)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Baseado em {stats.totalUsers} assinantes</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Assinantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : stats.totalUsers}
            </div>
            <p className="text-xs text-slate-500 mt-1">Psicólogos com acesso liberado</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Recebimentos Recentes */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recebimentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Psicólogo</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : recentPayments.map((payment, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-medium">{payment.full_name || 'Usuário MentePsi'}</div>
                    <div className="text-xs text-slate-400">{payment.email}</div>
                  </TableCell>
                  <TableCell>Professional</TableCell>
                  <TableCell className="font-medium text-emerald-600">{formatCurrency(currentPlanValue)}</TableCell>
                  <TableCell className="text-right text-slate-500">
                    {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}