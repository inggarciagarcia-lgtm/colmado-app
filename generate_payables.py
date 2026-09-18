import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

# 1. Payables Server Actions
payables_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getPayables() {
  return await prisma.transaction.findMany({
    where: { type: 'EXPENSE' },
    orderBy: { createdAt: 'desc' },
    include: {
      client: true
    }
  })
}

export async function createPayable(formData: FormData) {
  const amount = parseFloat(formData.get('amount') as string) || 0
  const description = (formData.get('description') as string)?.trim() || 'Gasto / Factura de proveedor'
  const clientId = (formData.get('clientId') as string)?.trim() || null
  const category = (formData.get('category') as string)?.trim() || 'Mercancía'
  const ncfOrBillNo = (formData.get('ncfOrBillNo') as string)?.trim() || null
  const dueDateStr = formData.get('dueDate') as string
  const dueDate = dueDateStr ? new Date(dueDateStr) : null
  const status = (formData.get('status') as string) || 'PENDING'
  const paymentMethod = (formData.get('paymentMethod') as string) || (status === 'PAID' ? 'EFECTIVO' : null)

  await prisma.transaction.create({
    data: {
      amount,
      type: 'EXPENSE',
      status,
      description,
      clientId,
      category,
      ncfOrBillNo,
      dueDate,
      paymentMethod
    }
  })

  revalidatePath('/payables')
  revalidatePath('/transactions')
  revalidatePath('/')
}

export async function markPayablePaid(id: string, paymentMethod: string = 'TRANSFERENCIA') {
  await prisma.transaction.update({
    where: { id },
    data: {
      status: 'PAID',
      paymentMethod
    }
  })

  revalidatePath('/payables')
  revalidatePath('/transactions')
  revalidatePath('/')
}

export async function deletePayable(id: string) {
  await prisma.transaction.delete({
    where: { id }
  })

  revalidatePath('/payables')
  revalidatePath('/transactions')
  revalidatePath('/')
}
"""

# 2. Payable Dialog
payable_dialog = """
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { createPayable } from "@/lib/actions/payables"

interface Provider {
  id: string
  name: string
  rnc: string | null
}

export function PayableDialog({ providers }: { providers: Provider[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('PENDING')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createPayable(formData)
      setOpen(false)
    } catch (err) {
      alert("Error al registrar la cuenta por pagar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        type="button" 
        onClick={() => setOpen(true)} 
        className="gap-2 bg-rose-600 text-white hover:bg-rose-700 shadow-sm font-semibold"
      >
        <Plus className="h-4 w-4" />
        Registrar Factura por Pagar
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registrar Cuenta por Pagar / Gasto</h2>
                <p className="text-xs text-slate-500">Ingresa la factura o cuenta pendiente de tu proveedor.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Proveedor */}
              <div className="space-y-1">
                <Label htmlFor="clientId" className="text-xs font-semibold text-slate-700">
                  Proveedor / Beneficiario *
                </Label>
                <select
                  id="clientId"
                  name="clientId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="">Selecciona un proveedor</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.rnc ? `(RNC: ${p.rnc})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* N° Factura / NCF y Categoría */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ncfOrBillNo" className="text-xs font-semibold text-slate-700">
                    N° Factura o NCF Recibido
                  </Label>
                  <Input id="ncfOrBillNo" name="ncfOrBillNo" placeholder="Ej. B0100001234 / FAC-45" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                    Categoría de Gasto
                  </Label>
                  <select
                    id="category"
                    name="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="Mercancía / Inventario">Mercancía / Inventario</option>
                    <option value="Servicios Básicos (Luz, Agua, Tel)">Servicios Básicos (Luz, Tel)</option>
                    <option value="Alquiler">Alquiler</option>
                    <option value="Nómina / Sueldos">Nómina / Sueldos</option>
                    <option value="Transporte / Flete">Transporte / Flete</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Otros Gastos">Otros Gastos</option>
                  </select>
                </div>
              </div>

              {/* Monto y Vencimiento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">
                    Monto Total RD$ *
                  </Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dueDate" className="text-xs font-semibold text-slate-700">
                    Fecha Límite de Pago
                  </Label>
                  <Input id="dueDate" name="dueDate" type="date" />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                  Concepto / Detalle de la Compra *
                </Label>
                <Input id="description" name="description" placeholder="Ej. Compra de 5 cajas de productos / Pago de internet" required />
              </div>

              {/* Estado y Método */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs font-semibold text-slate-700">
                    Estado de la Cuenta
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="PENDING">Pendiente de Pago (Crédito)</option>
                    <option value="PAID">Pagada Inmediatamente</option>
                  </select>
                </div>
                {status === 'PAID' && (
                  <div className="space-y-1">
                    <Label htmlFor="paymentMethod" className="text-xs font-semibold text-slate-700">
                      Método con el que Pagaste
                    </Label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="TRANSFERENCIA">Transferencia / Depósito</option>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta de Débito/Crédito</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                  {loading ? "Guardando..." : "Guardar Cuenta por Pagar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
"""

# 3. Payables List Page
payables_page = """
import { getPayables, deletePayable, markPayablePaid } from "@/lib/actions/payables"
import { getContacts } from "@/lib/actions/contacts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PayableDialog } from "./payable-dialog"
import { ArrowDownRight, Check, Trash2, AlertCircle, Clock, CheckCircle2 } from "lucide-react"

export default async function PayablesPage() {
  const payables = await getPayables()
  const allContacts = await getContacts()
  const providers = allContacts.filter(c => c.type === 'PROVIDER')
  const contactsList = providers.length > 0 ? providers : allContacts

  const now = new Date()
  const pendingPayables = payables.filter(p => p.status === 'PENDING')
  const totalPending = pendingPayables.reduce((sum, p) => sum + p.amount, 0)
  
  const overduePayables = pendingPayables.filter(p => p.dueDate && new Date(p.dueDate) < now)
  const totalOverdue = overduePayables.reduce((sum, p) => sum + p.amount, 0)

  const paidPayables = payables.filter(p => p.status === 'PAID')
  const totalPaid = paidPayables.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cuentas por Pagar (Proveedores y Gastos)</h1>
          <p className="text-sm text-muted-foreground">Control de facturas pendientes de pago, vencimientos y gastos operativos.</p>
        </div>
        <PayableDialog providers={contactsList} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-rose-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Total por Pagar (Pendiente)</CardTitle>
            <ArrowDownRight className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600 font-mono">
              RD${totalPending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingPayables.length} {pendingPayables.length === 1 ? 'factura pendiente' : 'facturas pendientes'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Facturas Vencidas</CardTitle>
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600 font-mono">
              RD${totalOverdue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overduePayables.length} {overduePayables.length === 1 ? 'factura que ya venció' : 'facturas que ya vencieron'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Pagado / Liquidado</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono">
              RD${totalPaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidPayables.length} pagos realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Facturas */}
      <div className="rounded-md border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor / Beneficiario</TableHead>
              <TableHead>N° Factura / NCF</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto RD$</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-28 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Clock className="h-6 w-6 text-slate-300" />
                    <span>No hay facturas por pagar registradas.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payables.map((p) => {
                const isOverdue = p.status === 'PENDING' && p.dueDate && new Date(p.dueDate) < now
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-slate-900">
                      <div>{p.client?.name || 'Gasto General'}</div>
                      {p.client?.rnc && <div className="text-[11px] text-slate-500 font-mono">RNC: {p.client.rnc}</div>}
                    </TableCell>
                    <TableCell>
                      {p.ncfOrBillNo ? (
                        <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded border">
                          {p.ncfOrBillNo}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium bg-slate-50 text-slate-700 px-2 py-1 rounded border">
                        {p.category || 'General'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 max-w-[200px] truncate">{p.description}</TableCell>
                    <TableCell>
                      {p.dueDate ? (
                        <span className={`text-xs font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {new Date(p.dueDate).toLocaleDateString()}
                          {isOverdue && <span className="block text-[10px] text-rose-500 uppercase font-black">¡Vencida!</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin fecha</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        p.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status === 'PAID' ? 'Pagada' : isOverdue ? 'Vencida' : 'Pendiente'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-base font-mono text-rose-700">
                      RD${p.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {p.status === 'PENDING' && (
                        <form action={markPayablePaid.bind(null, p.id, 'TRANSFERENCIA')} className="inline-block">
                          <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 font-semibold">
                            <Check className="h-4 w-4" />
                            Pagar
                          </Button>
                        </form>
                      )}
                      <form action={deletePayable.bind(null, p.id)} className="inline-block">
                        <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
"""

# 4. Updated Sidebar with Cuentas por Pagar
sidebar = """
import Link from 'next/link'
import { Home, Users, CreditCard, Package, ReceiptText, WalletCards, ArrowDownCircle } from 'lucide-react'

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-50/40">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <ReceiptText className="h-6 w-6 text-emerald-600" />
          <span>Gestor Negocio</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Ventas y Cobros
          </div>
          <Link
            href="/invoices"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-all hover:text-slate-900 hover:bg-slate-100 font-semibold"
          >
            <ReceiptText className="h-4 w-4 text-emerald-600" />
            Facturación (NCF)
          </Link>
          <Link
            href="/transactions"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <CreditCard className="h-4 w-4 text-blue-600" />
            Cuentas por Cobrar
          </Link>

          <div className="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Gastos y Proveedores
          </div>
          <Link
            href="/payables"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-all hover:text-slate-900 hover:bg-slate-100 font-semibold"
          >
            <ArrowDownCircle className="h-4 w-4 text-rose-600" />
            Cuentas por Pagar
          </Link>
          <Link
            href="/contacts"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <Users className="h-4 w-4 text-indigo-600" />
            Contactos (RNC)
          </Link>

          <div className="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Inventario
          </div>
          <Link
            href="/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <Package className="h-4 w-4 text-amber-600" />
            Productos y Stock
          </Link>
        </nav>
      </div>
    </div>
  )
}
"""

# 5. Updated Topbar
topbar = """
'use client'

import { Button, buttonVariants } from "@/components/ui/button"
import { CircleUser, Menu, Home, Users, CreditCard, Package, ReceiptText, ArrowDownCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-slate-50/40 px-4 lg:h-[60px] lg:px-6 print:hidden">
      <Sheet>
        <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }), "shrink-0 md:hidden cursor-pointer")}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menú</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader className="text-left border-b pb-4 mb-4">
            <SheetTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-emerald-600" />
              Gestor Negocio
            </SheetTitle>
          </SheetHeader>
          <nav className="grid gap-2 text-base font-medium">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/invoices"
              className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <ReceiptText className="h-4 w-4 text-emerald-600" />
              Facturación (NCF)
            </Link>
            <Link
              href="/transactions"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <CreditCard className="h-4 w-4" />
              Cuentas por Cobrar
            </Link>
            <Link
              href="/payables"
              className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50"
            >
              <ArrowDownCircle className="h-4 w-4 text-rose-600" />
              Cuentas por Pagar
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <Package className="h-4 w-4" />
              Productos
            </Link>
            <Link
              href="/contacts"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <Users className="h-4 w-4" />
              Contactos (RNC)
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "secondary", size: "icon" }), "rounded-full cursor-pointer")}>
          <CircleUser className="h-5 w-5" />
          <span className="sr-only">Menú de usuario</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/settings" className="w-full">
            <DropdownMenuItem className="cursor-pointer">Ajustes</DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">Cerrar Sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
"""

write_file("src/lib/actions/payables.ts", payables_actions)
write_file("src/app/(dashboard)/payables/payable-dialog.tsx", payable_dialog)
write_file("src/app/(dashboard)/payables/page.tsx", payables_page)
write_file("src/components/layout/sidebar.tsx", sidebar)
write_file("src/components/layout/topbar.tsx", topbar)
