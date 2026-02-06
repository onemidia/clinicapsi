'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/client'
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  MoreHorizontal,
  Plus,
  ReceiptText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([])
  const [totals, setTotals] = useState({ pago: 0, pendente: 0, total: 0 })
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [currentTab, setCurrentTab] = useState('todos')

  // Estados dos Modais
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [newTransactionOpen, setNewTransactionOpen] = useState(false)
  const [selectedApt, setSelectedApt] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  
  // Estados para Novo Lançamento
  const [patientsList, setPatientsList] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [transactionValue, setTransactionValue] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [calculatedDebt, setCalculatedDebt] = useState(0)

  const supabase = createClient()
  const { toast } = useToast()

  const fetchFinanceiro = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, 
        start_time, 
        price, 
        amount_paid,
        payment_status, 
        patient_id,
        patients (id, full_name, phone)
      `)
      .order('start_time', { ascending: false })

    if (data) {
      setAppointments(data)
      const sumTotal = data.reduce((acc, a) => acc + (Number(a.price) || 0), 0)
      const sumPago = data.reduce((acc, a) => acc + (Number(a.amount_paid) || 0), 0)
      setTotals({ pago: sumPago, pendente: sumTotal - sumPago, total: sumTotal })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFinanceiro()
    // Realtime para atualizar financeiro sozinho
    const channel = supabase.channel('financeiro_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchFinanceiro())
      .subscribe()
      
    // Carregar lista de pacientes para o dropdown
    const fetchPatients = async () => {
      const { data } = await supabase.from('patients').select('id, full_name, credit_balance').order('full_name')
      if (data) setPatientsList(data)
    }
    fetchPatients()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Efeito de Filtro e Busca
  useEffect(() => {
    let result = appointments

    // Filtro por Tab
    if (currentTab === 'pendentes') {
      result = result.filter(a => a.payment_status !== 'Pago')
    } else if (currentTab === 'pagos') {
      result = result.filter(a => a.payment_status === 'Pago')
    }

    // Filtro por Busca
    if (searchTerm) {
      result = result.filter(a => a.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    setFilteredAppointments(result)
  }, [appointments, currentTab, searchTerm])

  // Calcular dívida ao selecionar paciente no modal
  useEffect(() => {
    if (selectedPatient) {
      const debt = appointments
        .filter(a => a.patient_id === selectedPatient && a.payment_status !== 'Pago')
        .reduce((acc, a) => acc + (Number(a.price) - (Number(a.amount_paid) || 0)), 0)
      setCalculatedDebt(debt)
    }
  }, [selectedPatient, appointments])

  const openPaymentModal = (apt: any) => {
    setSelectedApt(apt)
    // Sugere o valor restante
    const remaining = Number(apt.price) - (Number(apt.amount_paid) || 0)
    setPaymentAmount(remaining.toFixed(2))
    setPaymentModalOpen(true)
  }

  const handleSavePayment = async () => {
    if (!selectedApt) return

    const amountToAdd = parseFloat(paymentAmount.replace(',', '.'))
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      toast({ variant: "destructive", title: "Valor inválido", description: "Digite um valor maior que zero." })
      return
    }

    const currentPaid = Number(selectedApt.amount_paid) || 0
    const totalPrice = Number(selectedApt.price) || 0
    
    // Soma Acumulativa com Trava de Segurança (não ultrapassar o preço)
    let newPaid = currentPaid + amountToAdd
    if (newPaid > totalPrice) newPaid = totalPrice
    
    // Lógica de Status Automático
    let newStatus = 'Pendente'
    if (newPaid >= totalPrice) newStatus = 'Pago'
    else if (newPaid > 0) newStatus = 'Parcial'

    const { error } = await supabase
      .from('appointments')
      .update({ amount_paid: newPaid, payment_status: newStatus })
      .eq('id', selectedApt.id)

    if (!error) {
      toast({ title: "Pagamento Registrado!", description: `Valor de R$ ${amountToAdd} adicionado.` })
      setPaymentModalOpen(false)
      fetchFinanceiro()
    }
  }

  const handleProcessTransaction = async () => {
    if (!selectedPatient || !transactionValue) return

    // 1. Validação e Preparação
    const amount = parseFloat(transactionValue.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Valor inválido", description: "Digite um valor maior que zero." })
      return
    }

    let remaining = amount
    
    // 2. Buscar sessões não pagas do paciente (FIFO: da mais antiga para a mais nova)
    const { data: unpaidApts } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', selectedPatient)
      .or('payment_status.eq.Pendente,payment_status.eq.Parcial')
      .order('start_time', { ascending: true })

    if (unpaidApts) {
      for (const apt of unpaidApts) {
        if (remaining <= 0) break

        const currentPaid = Number(apt.amount_paid) || 0
        const totalPrice = Number(apt.price) || 0
        const debt = totalPrice - currentPaid

        if (debt <= 0) continue

        const payNow = Math.min(remaining, debt)
        
        // 3. Atualização de Saldo (Soma Acumulativa)
        let newPaid = currentPaid + payNow
        if (newPaid > totalPrice) newPaid = totalPrice

        // 4. Definição de Status
        let newStatus = 'Pendente'
        if (newPaid >= totalPrice - 0.01) newStatus = 'Pago' // Margem de erro para float
        else if (newPaid > 0) newStatus = 'Parcial'

        // 5. Persistência no Banco
        await supabase
          .from('appointments')
          .update({ 
            amount_paid: newPaid, 
            payment_status: newStatus
          })
          .eq('id', apt.id)

        remaining -= payNow
      }
    }

    // 6. Tratamento de Excedente (Crédito)
    if (remaining > 0.01) {
      const { data: patient } = await supabase.from('patients').select('credit_balance').eq('id', selectedPatient).single()
      const currentCredit = Number(patient?.credit_balance) || 0
      
      await supabase
        .from('patients')
        .update({ credit_balance: currentCredit + remaining })
        .eq('id', selectedPatient)
      
      toast({ title: "Crédito Adicionado", description: `R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foram creditados ao paciente.` })
    } else {
      toast({ title: "Pagamento Processado", description: "Sessões foram baixadas com sucesso." })
    }

    setNewTransactionOpen(false)
    setTransactionValue('')
    setSelectedPatient('')
    setCalculatedDebt(0)
    setTransactionDate(new Date().toISOString().split('T')[0])
    fetchFinanceiro()
  }

  const handleGenerateReceipt = (apt: any) => {
    const patientName = apt.patients?.full_name || 'Paciente'
    const value = Number(apt.amount_paid) > 0 ? Number(apt.amount_paid) : Number(apt.price)
    const date = new Date().toLocaleDateString('pt-BR')
    const formattedValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const text = `RECIBO DE PAGAMENTO - MentePsi\n\nRecebemos de ${patientName} a quantia de ${formattedValue}.\nReferente a: Serviços de Psicoterapia.\nData: ${date}.`
    
    const phone = apt.patients?.phone?.replace(/\D/g, '')
    const link = phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(link, '_blank')
  }

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Financeiro</h1>
          <p className="text-slate-500">Controle de receitas e recebimentos</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm" onClick={() => setNewTransactionOpen(true)}><Plus className="mr-2 h-4 w-4"/> Novo Lançamento</Button>
          <Button variant="outline" className="text-slate-600">Exportar Relatório</Button>
        </div>
      </div>

      {/* CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Recebido</p>
              <h3 className="text-2xl font-bold text-teal-600">{formatBRL(totals.pago)}</h3>
            </div>
            <div className="bg-teal-100 p-3 rounded-full text-teal-600">
              <CheckCircle2 size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">A Receber (Pendente)</p>
              <h3 className="text-2xl font-bold text-amber-600">{formatBRL(totals.pendente)}</h3>
            </div>
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <Clock size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Previsão Total</p>
              <h3 className="text-2xl font-bold text-slate-800">{formatBRL(totals.total)}</h3>
            </div>
            <div className="bg-slate-100 p-3 rounded-full text-slate-600">
              <DollarSign size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA E FILTROS */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold">Lançamentos</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Buscar paciente..." 
                className="pl-9 w-[250px] bg-slate-50 border-none" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos" className="w-full" onValueChange={setCurrentTab}>
            <TabsList className="bg-slate-100 mb-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
              <TabsTrigger value="pagos">Pagos</TabsTrigger>
            </TabsList>

              <div className="rounded-md border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="p-4 text-left font-medium">Data</th>
                      <th className="p-4 text-left font-medium">Paciente</th>
                      <th className="p-4 text-left font-medium">Valor</th>
                      <th className="p-4 text-left font-medium">Saldo Devedor</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-right font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-medium text-slate-700">
                          {format(new Date(apt.start_time), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                        </td>
                        <td className="p-4 text-slate-600">{apt.patients?.full_name}</td>
                        <td className="p-4 font-bold text-slate-900">{formatBRL(Number(apt.price))}</td>
                        <td className="p-4 text-red-600 font-medium">
                          {formatBRL(Number(apt.price) - (Number(apt.amount_paid) || 0))}
                        </td>
                        <td className="p-4">
                          <Badge className={
                            apt.payment_status === 'Pago' 
                            ? 'bg-teal-100 text-teal-700 hover:bg-teal-100' 
                            : apt.payment_status === 'Parcial' 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                          }>
                            {apt.payment_status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleGenerateReceipt(apt)} title="Enviar Recibo">
                              <ReceiptText className="h-4 w-4 text-slate-500" />
                            </Button>
                            {apt.payment_status !== 'Pago' && (
                              <Button size="sm" variant="outline" className="text-teal-600 border-teal-200 hover:bg-teal-50" onClick={() => openPaymentModal(apt)}>
                                Baixar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* MODAL DE PAGAMENTO */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Informe o valor pago pelo paciente hoje.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Valor (R$)</Label>
              <Input id="amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSavePayment} className="bg-teal-600 hover:bg-teal-700 text-white">Confirmar Pagamento</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE NOVO LANÇAMENTO (CRÉDITO/BAIXA EM LOTE) */}
      <Dialog open={newTransactionOpen} onOpenChange={setNewTransactionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
            <DialogDescription>Registre um pagamento recebido. O sistema baixará as sessões mais antigas automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select onValueChange={setSelectedPatient} value={selectedPatient}>
                <SelectTrigger><SelectValue placeholder="Selecione o paciente..." /></SelectTrigger>
                <SelectContent>
                  {patientsList.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPatient && (
              <div className="p-3 bg-slate-50 rounded-lg border text-sm flex justify-between">
                <span className="text-slate-500">Saldo Devedor Total:</span>
                <span className="font-bold text-red-600">{formatBRL(calculatedDebt)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor Recebido (R$)</Label>
                <Input value={transactionValue} onChange={e => setTransactionValue(e.target.value)} placeholder="0,00" />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleProcessTransaction} className="bg-teal-600 hover:bg-teal-700 text-white w-full">Processar Pagamento</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}