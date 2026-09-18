import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

# 1. Companies Actions
companies_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getActiveCompany() {
  const cookieStore = await cookies()
  const activeCompanyId = cookieStore.get('active_company_id')?.value

  if (activeCompanyId) {
    const company = await prisma.company.findUnique({
      where: { id: activeCompanyId }
    })
    if (company) return company
  }

  // Fallback to first company
  let company = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' }
  })

  // If no company exists at all, create default
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Mi Empresa, SRL',
        rnc: '1-30-00000-0',
        phone: '809-555-0000',
        email: 'info@empresa.com.do',
        address: 'Santo Domingo, República Dominicana',
        slogan: '¡Gracias por su compra!',
        ncfB02Seq: 1,
        ncfB01Seq: 1,
        ncfB15Seq: 1,
        ncfExpiry: '31/12/2026',
        isDefault: true
      }
    })
  }

  return company
}

export async function getCompanies() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'asc' }
  })

  if (companies.length === 0) {
    const defaultCompany = await getActiveCompany()
    return [defaultCompany]
  }

  return companies
}

export async function switchCompany(companyId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_company_id', companyId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  })

  revalidatePath('/', 'layout')
}

export async function createCompany(formData: FormData) {
  const name = (formData.get('name') as string)?.trim() || 'Nueva Empresa'
  const rnc = (formData.get('rnc') as string)?.trim() || ''
  const phone = (formData.get('phone') as string)?.trim() || ''
  const email = (formData.get('email') as string)?.trim() || ''
  const address = (formData.get('address') as string)?.trim() || ''
  const slogan = (formData.get('slogan') as string)?.trim() || '¡Gracias por su compra!'
  const ncfExpiry = (formData.get('ncfExpiry') as string)?.trim() || '31/12/2026'

  const ncfB02Seq = parseInt(formData.get('ncfB02Seq') as string) || 1
  const ncfB01Seq = parseInt(formData.get('ncfB01Seq') as string) || 1
  const ncfB15Seq = parseInt(formData.get('ncfB15Seq') as string) || 1

  const newCompany = await prisma.company.create({
    data: {
      name,
      rnc,
      phone,
      email,
      address,
      slogan,
      ncfB02Seq,
      ncfB01Seq,
      ncfB15Seq,
      ncfExpiry
    }
  })

  const cookieStore = await cookies()
  cookieStore.set('active_company_id', newCompany.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })

  revalidatePath('/', 'layout')
  return newCompany.id
}

export async function updateActiveCompany(formData: FormData) {
  const active = await getActiveCompany()

  const name = (formData.get('name') as string)?.trim() || 'Mi Empresa'
  const rnc = (formData.get('rnc') as string)?.trim() || ''
  const phone = (formData.get('phone') as string)?.trim() || ''
  const email = (formData.get('email') as string)?.trim() || ''
  const address = (formData.get('address') as string)?.trim() || ''
  const slogan = (formData.get('slogan') as string)?.trim() || ''
  const ncfExpiry = (formData.get('ncfExpiry') as string)?.trim() || '31/12/2026'

  const ncfB02Seq = parseInt(formData.get('ncfB02Seq') as string) || 1
  const ncfB01Seq = parseInt(formData.get('ncfB01Seq') as string) || 1
  const ncfB15Seq = parseInt(formData.get('ncfB15Seq') as string) || 1

  await prisma.company.update({
    where: { id: active.id },
    data: {
      name,
      rnc,
      phone,
      email,
      address,
      slogan,
      ncfB02Seq,
      ncfB01Seq,
      ncfB15Seq,
      ncfExpiry
    }
  })

  revalidatePath('/', 'layout')
}

export async function deleteCompany(id: string) {
  const count = await prisma.company.count()
  if (count <= 1) {
    throw new Error("No puedes eliminar la única empresa activa del sistema.")
  }

  await prisma.company.delete({
    where: { id }
  })

  const remaining = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' }
  })

  if (remaining) {
    const cookieStore = await cookies()
    cookieStore.set('active_company_id', remaining.id, { path: '/' })
  }

  revalidatePath('/', 'layout')
}
"""

# 2. Company Switcher Component
company_switcher = """
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, ChevronDown, Plus, Check, X } from "lucide-react"
import { switchCompany, createCompany } from "@/lib/actions/companies"

interface Company {
  id: string
  name: string
  rnc: string | null
}

export function CompanySwitcher({ 
  companies, 
  activeCompany 
}: { 
  companies: Company[]
  activeCompany: Company 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSwitch(id: string) {
    setLoading(true)
    setDropdownOpen(false)
    try {
      await switchCompany(id)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createCompany(formData)
      setModalOpen(false)
      setDropdownOpen(false)
    } catch (err) {
      alert("Error al crear la empresa")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-all shadow-2xs max-w-[260px]"
      >
        <div className="p-1 bg-emerald-100 rounded text-emerald-700 shrink-0">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="text-left truncate">
          <span className="block truncate font-bold">{activeCompany.name}</span>
          {activeCompany.rnc && <span className="block text-[10px] text-slate-400 font-mono -mt-0.5">RNC: {activeCompany.rnc}</span>}
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white p-2 shadow-xl border border-slate-200 z-50 animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b mb-1">
              Mis Empresas Registradas
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {companies.map((c) => {
                const isActive = c.id === activeCompany.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSwitch(c.id)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg text-left transition-all ${
                      isActive ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate">{c.name}</div>
                      {c.rnc && <div className="text-[10px] text-slate-400 font-mono">RNC: {c.rnc}</div>}
                    </div>
                    {isActive && <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                  </button>
                )
              })}
            </div>

            <div className="border-t mt-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false)
                  setModalOpen(true)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                + Crear Otra Empresa
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal Crear Nueva Empresa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Registrar Nueva Empresa</h2>
                  <p className="text-xs text-slate-500">Tendrá su propio RNC, facturación y clientes.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="comp-name" className="text-xs font-semibold text-slate-700">
                  Nombre de la Empresa o Razón Social *
                </Label>
                <Input id="comp-name" name="name" placeholder="Ej. Taller San Juan, SRL" required autoFocus />
              </div>

              <div className="space-y-1">
                <Label htmlFor="comp-rnc" className="text-xs font-semibold text-slate-700">
                  RNC de la Empresa *
                </Label>
                <Input id="comp-rnc" name="rnc" placeholder="Ej. 1-31-00000-0 (9 u 11 dígitos)" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="comp-phone" className="text-xs font-semibold text-slate-700">
                    Teléfono
                  </Label>
                  <Input id="comp-phone" name="phone" placeholder="809-555-0000" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="comp-email" className="text-xs font-semibold text-slate-700">
                    Correo
                  </Label>
                  <Input id="comp-email" name="email" type="email" placeholder="ventas@negocio.do" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="comp-address" className="text-xs font-semibold text-slate-700">
                  Dirección Comercial
                </Label>
                <Input id="comp-address" name="address" placeholder="Calle, Sector, Ciudad" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {loading ? "Creando..." : "Crear y Activar Empresa"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
"""

# 3. Contacts Actions with CompanyId
contacts_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export async function getContacts() {
  const company = await getActiveCompany()
  return await prisma.client.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createContact(formData: FormData) {
  const company = await getActiveCompany()
  const name = formData.get('name') as string
  const rnc = (formData.get('rnc') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null
  const type = (formData.get('type') as string) || 'CLIENT'

  await prisma.client.create({
    data: { 
      companyId: company.id,
      name, 
      rnc, 
      email, 
      phone, 
      address, 
      type 
    }
  })

  revalidatePath('/contacts')
  revalidatePath('/invoices/new')
}

export async function deleteContact(id: string) {
  await prisma.client.delete({
    where: { id }
  })
  revalidatePath('/contacts')
  revalidatePath('/invoices/new')
}
"""

# 4. Products Actions with CompanyId
products_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export async function getProducts() {
  const company = await getActiveCompany()
  return await prisma.product.findMany({
    where: { companyId: company.id },
    orderBy: { name: 'asc' }
  })
}

export async function createProduct(formData: FormData) {
  const company = await getActiveCompany()
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const stock = parseInt(formData.get('stock') as string) || 0

  await prisma.product.create({
    data: { 
      companyId: company.id,
      name, 
      description, 
      price, 
      stock 
    }
  })

  revalidatePath('/products')
  revalidatePath('/invoices/new')
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id }
  })
  revalidatePath('/products')
  revalidatePath('/invoices/new')
}
"""

# 5. Invoices Actions with CompanyId
invoices_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export async function getInvoices() {
  const company = await getActiveCompany()
  return await prisma.invoice.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      items: true
    }
  })
}

export async function getInvoiceById(id: string) {
  return await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      company: true,
      items: {
        include: {
          product: true
        }
      }
    }
  })
}

export interface InvoiceItemInput {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export async function createInvoice(data: {
  clientId: string
  ncfType: string // B02, B01, B15, NONE
  paymentMethod: string
  notes?: string
  status: string
  items: InvoiceItemInput[]
  discount?: number
  itbisRate?: number
}) {
  const company = await getActiveCompany()

  // 1. Generate NCF for active company
  let ncf: string | null = null
  if (data.ncfType === 'B02') {
    ncf = `B02${String(company.ncfB02Seq).padStart(8, '0')}`
    await prisma.company.update({
      where: { id: company.id },
      data: { ncfB02Seq: { increment: 1 } }
    })
  } else if (data.ncfType === 'B01') {
    ncf = `B01${String(company.ncfB01Seq).padStart(8, '0')}`
    await prisma.company.update({
      where: { id: company.id },
      data: { ncfB01Seq: { increment: 1 } }
    })
  } else if (data.ncfType === 'B15') {
    ncf = `B15${String(company.ncfB15Seq).padStart(8, '0')}`
    await prisma.company.update({
      where: { id: company.id },
      data: { ncfB15Seq: { increment: 1 } }
    })
  }

  // 2. Sequential internal number for this company
  const count = await prisma.invoice.count({ where: { companyId: company.id } })
  const invoiceNumber = `FAC-${String(count + 1).padStart(4, '0')}`

  // 3. Calculations
  const subtotal = data.items.reduce((acc, item) => acc + item.total, 0)
  const discount = data.discount || 0
  const taxableBase = Math.max(0, subtotal - discount)
  const itbisRate = data.itbisRate !== undefined ? data.itbisRate : 18
  const itbis = taxableBase * (itbisRate / 100)
  const total = taxableBase + itbis

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      number: invoiceNumber,
      ncfType: data.ncfType,
      ncf: ncf,
      ncfExpiry: company.ncfExpiry || '31/12/2026',
      clientId: data.clientId,
      status: data.status,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      subtotal,
      discount,
      itbisRate,
      itbis,
      total,
      items: {
        create: data.items.map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        }))
      },
      transactions: {
        create: {
          companyId: company.id,
          clientId: data.clientId,
          amount: total,
          type: 'INCOME',
          status: data.status === 'PAID' ? 'PAID' : 'PENDING',
          description: ncf ? `Factura NCF ${ncf}` : `Factura ${invoiceNumber}`
        }
      }
    }
  })

  // Reduce product stocks
  for (const item of data.items) {
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity }
        }
      }).catch(() => {})
    }
  }

  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/products')
  revalidatePath('/settings')
  revalidatePath('/')

  return invoice.id
}

export async function markInvoicePaid(id: string) {
  await prisma.invoice.update({
    where: { id },
    data: { status: 'PAID' }
  })

  await prisma.transaction.updateMany({
    where: { invoiceId: id },
    data: { status: 'PAID' }
  })

  revalidatePath(`/invoices/${id}`)
  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/')
}

export async function deleteInvoice(id: string) {
  await prisma.transaction.deleteMany({
    where: { invoiceId: id }
  })

  await prisma.invoice.delete({
    where: { id }
  })

  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/')
}
"""

# 6. Payables Actions with CompanyId
payables_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export async function getPayables() {
  const company = await getActiveCompany()
  return await prisma.transaction.findMany({
    where: { 
      type: 'EXPENSE',
      companyId: company.id 
    },
    orderBy: { createdAt: 'desc' },
    include: {
      client: true
    }
  })
}

export async function createPayable(formData: FormData) {
  const company = await getActiveCompany()
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
      companyId: company.id,
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

# 7. Layout with CompanySwitcher
layout_tsx = """
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { getCompanies, getActiveCompany } from "@/lib/actions/companies"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const companies = await getCompanies()
  const activeCompany = await getActiveCompany()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] print:block">
      <div className="hidden border-r bg-slate-50/40 md:block print:hidden">
        <Sidebar companyName={activeCompany.name} />
      </div>
      <div className="flex flex-col print:block">
        <Topbar companies={companies} activeCompany={activeCompany} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 print:p-0">
          {children}
        </main>
      </div>
    </div>
  )
}
"""

# 8. Topbar with CompanySwitcher component
topbar_tsx = """
'use client'

import { Button, buttonVariants } from "@/components/ui/button"
import { CircleUser, Menu, Home, Users, CreditCard, Package, ReceiptText, ArrowDownCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CompanySwitcher } from "./company-switcher"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Company {
  id: string
  name: string
  rnc: string | null
}

export function Topbar({ 
  companies, 
  activeCompany 
}: { 
  companies: Company[]
  activeCompany: Company 
}) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-slate-50/40 px-4 lg:h-[60px] lg:px-6 print:hidden">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }), "shrink-0 md:hidden cursor-pointer")}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menú</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader className="text-left border-b pb-4 mb-4">
            <SheetTitle className="flex items-center gap-2 truncate">
              <ReceiptText className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="truncate">{activeCompany.name}</span>
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

      {/* Selector Multi-Empresa destacado en la barra superior */}
      <div className="flex-1 flex items-center">
        <CompanySwitcher companies={companies} activeCompany={activeCompany} />
      </div>

      {/* Menú de Usuario */}
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "secondary", size: "icon" }), "rounded-full cursor-pointer")}>
          <CircleUser className="h-5 w-5" />
          <span className="sr-only">Menú de usuario</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="truncate max-w-[180px]">{activeCompany.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/settings" className="w-full">
            <DropdownMenuItem className="cursor-pointer">Ajustes de Empresas</DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">Cerrar Sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
"""

# 9. Dashboard filtered by Active Company
dashboard_page = """
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, DollarSign, Users, ArrowRight, Building2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getActiveCompany } from "@/lib/actions/companies"
import Link from "next/link"

export default async function Dashboard() {
  const company = await getActiveCompany()

  const clientsCount = await prisma.client.count({
    where: { companyId: company.id }
  })

  const transactions = await prisma.transaction.findMany({
    where: { companyId: company.id }
  })
  
  const totalCobrar = transactions
    .filter(t => t.type === 'INCOME' && t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amount, 0)
    
  const totalPagar = transactions
    .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amount, 0)
    
  const balance = transactions
    .filter(t => t.status === 'PAID')
    .reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0)

  const pendingIncomesCount = transactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').length
  const pendingExpensesCount = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{company.name}</h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Empresa Activa
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            RNC: <span className="font-mono font-medium">{company.rnc || 'Sin RNC'}</span> • Resumen financiero general.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {/* Balance */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Balance Neto en Caja
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black font-mono ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              RD${balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresos cobrados - Pagos realizados
            </p>
          </CardContent>
        </Card>

        {/* Por Cobrar */}
        <Link href="/transactions" className="group">
          <Card className="shadow-xs hover:border-emerald-300 transition-all cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700">
                Por Cobrar (Clientes)
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600 font-mono">+RD${totalCobrar.toFixed(2)}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {pendingIncomesCount} {pendingIncomesCount === 1 ? 'factura pendiente' : 'facturas pendientes'}
                </p>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Por Pagar (Cuentas por Pagar) */}
        <Link href="/payables" className="group">
          <Card className="shadow-xs hover:border-rose-300 transition-all cursor-pointer h-full border-l-4 border-l-rose-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-rose-700">
                Por Pagar (Proveedores)
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-600 font-mono">-RD${totalPagar.toFixed(2)}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground font-medium text-rose-600">
                  {pendingExpensesCount} {pendingExpensesCount === 1 ? 'factura por pagar' : 'facturas por pagar'}
                </p>
                <ArrowRight className="h-3 w-3 text-rose-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Directorio */}
        <Link href="/contacts" className="group">
          <Card className="shadow-xs hover:border-indigo-300 transition-all cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-indigo-700">
                Contactos y RNC
              </CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 font-mono">{clientsCount}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Clientes y Proveedores
                </p>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
"""

# 10. Settings Form & Page
settings_page = """
import { getCompanies, getActiveCompany } from "@/lib/actions/companies"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const companies = await getCompanies()
  const activeCompany = await getActiveCompany()

  return (
    <div className="max-w-4xl mx-auto w-full py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ajustes y Gestión Multi-Empresa</h1>
        <p className="text-sm text-muted-foreground">Administra tus empresas registradas, sus datos fiscales y secuencias de NCF.</p>
      </div>

      <SettingsForm companies={companies} activeCompany={activeCompany} />
    </div>
  )
}
"""

settings_form = """
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateActiveCompany, deleteCompany } from "@/lib/actions/companies"
import { Check, Building2, Receipt, Save, Trash2 } from "lucide-react"

interface Company {
  id: string
  name: string
  rnc: string | null
  phone: string | null
  email: string | null
  address: string | null
  slogan: string | null
  ncfB02Seq: number
  ncfB01Seq: number
  ncfB15Seq: number
  ncfExpiry: string | null
}

export function SettingsForm({ 
  companies, 
  activeCompany 
}: { 
  companies: Company[]
  activeCompany: Company 
}) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    const formData = new FormData(e.currentTarget)
    try {
      await updateActiveCompany(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      alert("Error al guardar la configuración")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (confirm(`¿Estás seguro de que deseas eliminar la empresa "${name}"? Esta acción borrará sus facturas y datos asociados.`)) {
      try {
        await deleteCompany(id)
      } catch (err: any) {
        alert(err.message || "Error al eliminar empresa")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Lista de Empresas */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Todas tus Empresas ({companies.length})</CardTitle>
              <CardDescription>
                Empresas creadas en este sistema. Puedes cambiar entre ellas usando el selector arriba a la izquierda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 divide-y">
          {companies.map(c => {
            const isActive = c.id === activeCompany.id
            return (
              <div key={c.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{c.name}</span>
                      {isActive && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          En Uso Actualmente
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      RNC: {c.rnc || 'Sin RNC'} • {c.phone || 'Sin teléfono'}
                    </div>
                  </div>
                </div>

                {companies.length > 1 && !isActive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id, c.name)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Formulario de la Empresa Activa */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900">
                  Editar Empresa Activa: <span className="text-emerald-700 font-extrabold">{activeCompany.name}</span>
                </CardTitle>
                <CardDescription>
                  Cambia el nombre, RNC, teléfonos y datos de facturación de esta empresa.
                </CardDescription>
              </div>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold shadow-xs">
                <Save className="h-4 w-4" />
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-bold text-slate-800">
                  Nombre de la Empresa o Razón Social *
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={activeCompany.name}
                  placeholder="Ej. Comercializadora Quisqueya, SRL"
                  className="font-medium text-base h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rnc" className="text-sm font-bold text-slate-800">
                  RNC de la Empresa *
                </Label>
                <Input
                  id="rnc"
                  name="rnc"
                  defaultValue={activeCompany.rnc || ''}
                  placeholder="Ej. 1-30-12345-6"
                  className="font-mono text-base h-11"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                  Teléfono de Contacto
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={activeCompany.phone || ''}
                  placeholder="Ej. 809-555-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={activeCompany.email || ''}
                  placeholder="contacto@empresa.do"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-semibold text-slate-700">
                Dirección Física / Comercial
              </Label>
              <Input
                id="address"
                name="address"
                defaultValue={activeCompany.address || ''}
                placeholder="Ej. Av. Winston Churchill #45, Santo Domingo, D.N."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slogan" className="text-sm font-semibold text-slate-700">
                Mensaje o Términos al pie de la Factura
              </Label>
              <Input
                id="slogan"
                name="slogan"
                defaultValue={activeCompany.slogan || ''}
                placeholder="Ej. ¡Gracias por su compra! No se aceptan devoluciones sin factura."
              />
            </div>
          </CardContent>
        </Card>

        {/* Secuencias NCF de esta empresa */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Control de Secuencias NCF de {activeCompany.name}</CardTitle>
                <CardDescription>
                  Cada empresa tiene su propio correlativo de comprobantes autorizado por la DGII.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ncfB02Seq" className="text-sm font-semibold text-slate-700">
                  Próximo Consumidor Final (B02)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-500">B02</span>
                  <Input
                    id="ncfB02Seq"
                    name="ncfB02Seq"
                    type="number"
                    min="1"
                    defaultValue={activeCompany.ncfB02Seq}
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ncfB01Seq" className="text-sm font-semibold text-slate-700">
                  Próximo Crédito Fiscal (B01)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-500">B01</span>
                  <Input
                    id="ncfB01Seq"
                    name="ncfB01Seq"
                    type="number"
                    min="1"
                    defaultValue={activeCompany.ncfB01Seq}
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ncfB15Seq" className="text-sm font-semibold text-slate-700">
                  Próximo Gubernamental (B15)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-500">B15</span>
                  <Input
                    id="ncfB15Seq"
                    name="ncfB15Seq"
                    type="number"
                    min="1"
                    defaultValue={activeCompany.ncfB15Seq}
                    className="font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="ncfExpiry" className="text-sm font-semibold text-slate-700">
                Fecha de Vencimiento de Secuencia NCF
              </Label>
              <Input
                id="ncfExpiry"
                name="ncfExpiry"
                defaultValue={activeCompany.ncfExpiry || '31/12/2026'}
                placeholder="Ej. 31/12/2026"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              {saved ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">
                  <Check className="h-4 w-4" /> ¡Empresa actualizada exitosamente!
                </span>
              ) : <span />}

              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-xs">
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : "Guardar Cambios de la Empresa"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
"""

write_file("src/lib/actions/companies.ts", companies_actions)
write_file("src/components/layout/company-switcher.tsx", company_switcher)
write_file("src/lib/actions/contacts.ts", contacts_actions)
write_file("src/lib/actions/products.ts", products_actions)
write_file("src/lib/actions/invoices.ts", invoices_actions)
write_file("src/lib/actions/payables.ts", payables_actions)
write_file("src/app/(dashboard)/layout.tsx", layout_tsx)
write_file("src/components/layout/topbar.tsx", topbar_tsx)
write_file("src/app/(dashboard)/page.tsx", dashboard_page)
write_file("src/app/(dashboard)/settings/page.tsx", settings_page)
write_file("src/app/(dashboard)/settings/settings-form.tsx", settings_form)
