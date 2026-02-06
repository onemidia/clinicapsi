'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import { Search, FileText, User, Printer } from "lucide-react"
import { NewDocumentModal } from '@/components/new-document-modal'

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [reports, setReports] = useState<any[]>([])
  const [professionalData, setProfessionalData] = useState<any>(null)
  const supabase = createClient()

  const fetchDocuments = async () => {
    let query = supabase
      .from('official_reports')
      .select(`
        id,
        created_at,
        title,
        type,
        content,
        professional_name,
        professional_crp,
        patient_id,
        patients (
          full_name,
          cpf
        )
      `)
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`)
    }

    const { data } = await query
    if (data) setReports(data)
  }

  useEffect(() => {
    fetchDocuments()
  }, [searchTerm])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('professional_profile').select('*').single()
      if (data) setProfessionalData(data)
    }
    fetchProfile()
  }, [])

  const handlePrint = (doc: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Substituição dinâmica de cidade se ainda houver o placeholder
    let content = doc.content || ''
    if (professionalData?.city) {
      content = content.replace(/\[CIDADE\]/g, professionalData.city)
    }

    const patientName = doc.patients?.full_name || 'Paciente'
    const patientCpf = doc.patients?.cpf || 'Não informado'

    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.title}</title>
          <style>
            @page { size: A4; margin: 3cm; }
            body { 
              font-family: 'Georgia', 'Times New Roman', serif; 
              font-size: 12pt; 
              line-height: 1.6; 
              color: #1a1a1a;
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
            }
            .header h1 { 
              font-size: 28px; 
              font-weight: bold; 
              text-transform: uppercase; 
              letter-spacing: 2px; 
              margin: 0 0 5px 0;
              color: #2c3e50;
            }
            .header p { 
              font-size: 14px; 
              color: #7f8c8d; 
              font-style: italic;
              margin: 0;
            }
            .patient-info {
              margin-bottom: 40px;
              padding: 10px 0;
              border-top: 1px solid #eee;
              border-bottom: 1px solid #eee;
              font-size: 14px;
              color: #555;
              text-align: center;
            }
            .content { 
              text-align: justify; 
              white-space: pre-wrap; 
              flex: 1;
            }
            .footer { 
              margin-top: 80px; 
              text-align: center; 
              page-break-inside: avoid;
            }
            .signature-line { 
              border-top: 1px solid #000; 
              width: 250px; 
              margin: 0 auto 10px; 
            }
            .prof-name { font-weight: bold; text-transform: uppercase; font-size: 14px; }
            .prof-crp { font-size: 12px; color: #555; }
            @media print { 
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MentePsi</h1>
            <p>Atendimento Psicológico Especializado</p>
          </div>
          
          <div class="patient-info">
            <strong>Paciente:</strong> ${patientName} &nbsp;|&nbsp; <strong>CPF:</strong> ${patientCpf}
          </div>

          <div class="content">
            ${content}
          </div>

          <div class="footer">
            <div class="signature-line"></div>
            <div class="prof-name">${doc.professional_name || professionalData?.full_name || 'Profissional'}</div>
            <div class="prof-crp">Psicóloga Clínica - CRP: ${doc.professional_crp || professionalData?.crp || ''}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="container mx-auto p-6 space-y-8 print:hidden">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Central de Documentos</h1>
          <p className="text-slate-500">Gerencie atestados, laudos e relatórios.</p>
        </div>
        <NewDocumentModal onDocumentCreated={fetchDocuments} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Documentos</CardTitle>
          <div className="relative max-w-md mt-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por título..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum documento encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {reports.map(report => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors bg-white">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{report.title || report.type || 'Documento Sem Título'}</p>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {report.patients?.full_name}</span>
                        <span>•</span>
                        <span>{new Date(report.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handlePrint(report)}>
                    <Printer className="h-4 w-4 mr-2" /> Imprimir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}