'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/client'
import { 
  Search, 
  Phone,
  FileText
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NewPatientModal } from '@/app/dashboard/new-patient-modal'

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchPatients = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('patients')
        .select('*')
        .order('full_name', { ascending: true })
      
      if (data) setPatients(data)
      setLoading(false)
    }
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-slate-500">Gerencie seus pacientes e prontuários.</p>
        </div>
        <NewPatientModal />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listagem</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por nome..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Sessão</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-slate-500">Nenhum paciente encontrado.</TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{patient.full_name}</span>
                        <span className="text-xs text-slate-500">{patient.cpf}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === 'Ativo' ? 'default' : 'secondary'}>
                        {patient.status || 'Ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      R$ {patient.session_value || '0,00'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        {patient.whatsapp ? <Phone className="h-3 w-3" /> : null}
                        {patient.whatsapp || patient.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/pacientes/${patient.id}`}>
                          <FileText className="h-4 w-4 mr-2" /> Ficha Clínica Digital
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}