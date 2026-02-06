'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Trash2, 
  Loader2,
  Search
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function GestaoPsicologos() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('admin_users_view')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setUsers(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // FUNÇÃO PARA ATIVAR/SUSPENDER
  async function handleToggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    
    const { error } = await supabase
      .from('user_roles')
      .update({ status: newStatus })
      .eq('user_id', userId)

    if (!error) fetchUsers() // Atualiza a lista na tela
  }

  // FUNÇÃO PARA EXCLUIR
  async function handleDeleteUser(userId: string) {
    if (confirm("TEM CERTEZA? Isso removerá o acesso deste psicólogo permanentemente.")) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      if (!error) fetchUsers()
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Gestão de Psicólogos</h1>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou e-mail..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Psicólogo</TableHead>
              <TableHead>CRP</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin inline mr-2"/> Carregando...</TableCell></TableRow>
            ) : filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.full_name || 'Sem nome'}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </TableCell>
                <TableCell>{user.crp || '-'}</TableCell>
                <TableCell>
                  <Badge className={user.status === 'active' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                    {user.status === 'active' ? 'Ativo' : 'Suspenso'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status)}>
                        {user.status === 'active' ? (
                          <><UserX className="mr-2 h-4 w-4 text-orange-500" /> Suspender</>
                        ) : (
                          <><UserCheck className="mr-2 h-4 w-4 text-green-500" /> Ativar</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 font-bold"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir Conta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}