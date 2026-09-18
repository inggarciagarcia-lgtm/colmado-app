import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content.strip())

# 1. Server Actions for Transactions
actions_ts = """
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTransactions() {
  return await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: true
    }
  })
}

export async function createTransaction(formData: FormData) {
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const clientId = formData.get('clientId') as string || null
  const status = formData.get('status') as string

  await prisma.transaction.create({
    data: { amount, type, description, clientId, status }
  })

  revalidatePath('/transactions')
  revalidatePath('/') // update dashboard
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({
    where: { id }
  })
  revalidatePath('/transactions')
  revalidatePath('/')
}

export async function markAsPaid(id: string) {
  await prisma.transaction.update({
    where: { id },
    data: { status: 'PAID' }
  })
  revalidatePath('/transactions')
  revalidatePath('/')
}
"""

# 2. Transactions Page
transactions_page_tsx = """
import { getTransactions, deleteTransaction, markAsPaid } from "@/lib/actions/transactions"
import { getContacts } from "@/lib/actions/contacts"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { Check, Trash2 } from "lucide-react"

export default async function TransactionsPage() {
  const transactions = await getTransactions()
  const contacts = await getContacts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cuentas (Por Cobrar / Pagar)</h1>
        <TransactionDialog contacts={contacts} />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No hay transacciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{tx.description || '-'}</TableCell>
                  <TableCell>{tx.client?.name || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tx.type === 'INCOME' ? 'Por Cobrar' : 'Por Pagar'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.status === 'PAID' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {tx.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${tx.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {tx.status === 'PENDING' && (
                      <form action={markAsPaid.bind(null, tx.id)} className="inline-block">
                        <Button variant="ghost" size="icon" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50">
                          <Check className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                    <form action={deleteTransaction.bind(null, tx.id)} className="inline-block">
                      <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
"""

# 3. Transaction Dialog Component
transaction_dialog_tsx = """
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createTransaction } from "@/lib/actions/transactions"

type Contact = { id: string, name: string, type: string }

export function TransactionDialog({ contacts }: { contacts: Contact[] }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('INCOME')

  async function onSubmit(formData: FormData) {
    await createTransaction(formData)
    setOpen(false)
  }

  // Filter contacts based on type (INCOME -> Clients, EXPENSE -> Providers)
  // Or just show all if desired. We will show all but sort them.
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cuenta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Añadir Cuenta</DialogTitle>
            <DialogDescription>
              Registra una nueva cuenta por cobrar o por pagar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <select 
                id="type" 
                name="type" 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="INCOME">Por Cobrar (Ingreso)</option>
                <option value="EXPENSE">Por Pagar (Gasto)</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Monto ($)
              </Label>
              <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Input id="description" name="description" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientId" className="text-right">
                Contacto
              </Label>
              <select 
                id="clientId" 
                name="clientId" 
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Sin contacto asociado</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type === 'CLIENT' ? 'Cliente' : 'Proveedor'})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <select 
                id="status" 
                name="status" 
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Cuenta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
"""

write_file("src/lib/actions/transactions.ts", actions_ts)
write_file("src/app/(dashboard)/transactions/page.tsx", transactions_page_tsx)
write_file("src/components/transactions/transaction-dialog.tsx", transaction_dialog_tsx)
