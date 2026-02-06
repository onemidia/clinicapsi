'use client'

import React from 'react'
import { 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Search,
  Download
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AssinaturasPage() {
  // Mock Data - Substituir por fetch do Supabase (tabela 'subscriptions')
  const subscriptions = [
    { id: 1, psychologist: 'Dra. Aline Barbosa', plan: 'Profissional', value: 49.90, date: '2023-10-15', status: 'Ativa' },
    { id: 2, psychologist: 'Dr. João Silva', plan: 'Clínica', value: 89.90, date: '2023-11-01', status: 'Ativa' },
    { id: 3, psychologist: 'Psic. Maria Oliveira', plan: 'Básico', value: 29.90, date: '2023-09-20', status: 'Pendente' },
    { id: 4, psychologist: 'Pedro Santos', plan: 'Free', value: 0.00, date: '2023-12-05', status: 'Ativa' },
    { id: 5, psychologist: 'Ana Costa', plan: 'Profissional', value: 49.90, date: '2023-08-10', status: 'Cancelada' },
  ]

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Assinaturas</h1>
          <p className="text-slate-500">Gestão de planos e receita recorrente.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-slate-600"><Download className="mr-2 h-4 w-4"/> Exportar</Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Assinaturas</CardTitle>
            <CreditCard className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1,248</div>
            <p className="text-xs text-slate-500 mt-1">+12% em relação ao mês passado</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Receita Recorrente (MRR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">R$ 42.5k</div>
            <p className="text-xs text-slate-500 mt-1">Previsão para este mês</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Cancelamentos (Churn)</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">2.4%</div>
            <p className="text-xs text-slate-500 mt-1">Abaixo da média do mercado</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Assinaturas */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800">Lista de Assinantes</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar psicólogo..." className="pl-8 bg-slate-50 border-slate-200" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Psicólogo</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-slate-900">{sub.psychologist}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                      {sub.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {sub.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(sub.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={
                      sub.status === 'Ativa' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' :
                      sub.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200' :
                      'bg-red-100 text-red-700 hover:bg-red-100 border-red-200'
                    }>
                      {sub.status === 'Ativa' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {sub.status}
                    </Badge>
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