import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

# 1. Settings Actions
settings_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCompanySettings() {
  let settings = await prisma.companySettings.findUnique({
    where: { id: 'default' }
  })

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        id: 'default',
        name: 'Mi Negocio, SRL',
        rnc: '1-30-00000-0',
        phone: '809-555-0000',
        email: 'ventas@minegocio.do',
        address: 'Santo Domingo, República Dominicana',
        slogan: '¡Gracias por su compra!',
        ncfB02Seq: 1,
        ncfB01Seq: 1,
        ncfB15Seq: 1,
        ncfExpiry: '31/12/2026'
      }
    })
  }

  return settings
}

export async function updateCompanySettings(formData: FormData) {
  const name = (formData.get('name') as string)?.trim() || 'Mi Negocio'
  const rnc = (formData.get('rnc') as string)?.trim() || ''
  const phone = (formData.get('phone') as string)?.trim() || ''
  const email = (formData.get('email') as string)?.trim() || ''
  const address = (formData.get('address') as string)?.trim() || ''
  const slogan = (formData.get('slogan') as string)?.trim() || ''
  const ncfExpiry = (formData.get('ncfExpiry') as string)?.trim() || '31/12/2026'

  const ncfB02Seq = parseInt(formData.get('ncfB02Seq') as string) || 1
  const ncfB01Seq = parseInt(formData.get('ncfB01Seq') as string) || 1
  const ncfB15Seq = parseInt(formData.get('ncfB15Seq') as string) || 1

  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: { 
      name, rnc, phone, email, address, slogan, 
      ncfB02Seq, ncfB01Seq, ncfB15Seq, ncfExpiry 
    },
    create: { 
      id: 'default', name, rnc, phone, email, address, slogan, 
      ncfB02Seq, ncfB01Seq, ncfB15Seq, ncfExpiry 
    }
  })

  revalidatePath('/settings')
  revalidatePath('/invoices')
  revalidatePath('/')
}
"""

# 2. Settings Form
settings_form = """
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCompanySettings } from "@/lib/actions/settings"
import { Check, Building2, Receipt } from "lucide-react"

interface Settings {
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

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    const formData = new FormData(e.currentTarget)
    try {
      await updateCompanySettings(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      alert("Error al guardar la configuración")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Datos de la Empresa (Emisor DGII)</CardTitle>
              <CardDescription>
                Información comercial y fiscal de tu negocio en República Dominicana.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold">
                Razón Social o Nombre Comercial *
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={initialSettings.name}
                placeholder="Ej. Comercial García, SRL"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rnc" className="text-sm font-semibold">
                RNC de la Empresa *
              </Label>
              <Input
                id="rnc"
                name="rnc"
                defaultValue={initialSettings.rnc || ''}
                placeholder="Ej. 1-30-12345-6 (9 u 11 dígitos)"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Teléfono de Contacto
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialSettings.phone || ''}
                placeholder="Ej. 809-555-1234"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initialSettings.email || ''}
                placeholder="info@empresa.com.do"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-sm font-semibold">
              Dirección Fiscal
            </Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialSettings.address || ''}
              placeholder="Ej. Av. 27 de Febrero #100, Ens. Naco, Santo Domingo, D.N."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slogan" className="text-sm font-semibold">
              Mensaje al pie de la Factura
            </Label>
            <Input
              id="slogan"
              name="slogan"
              defaultValue={initialSettings.slogan || ''}
              placeholder="Ej. ¡Gracias por su preferencia! No se aceptan devoluciones sin factura."
            />
          </div>
        </CardContent>
      </Card>

      {/* Control de Comprobantes Fiscales (NCF) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Control de Secuencias NCF (DGII)</CardTitle>
              <CardDescription>
                Indica el siguiente número de comprobante fiscal autorizado por la DGII.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ncfB02Seq" className="text-sm font-semibold">
                Próximo Consumidor Final (B02)
              </Label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-500">B02</span>
                <Input
                  id="ncfB02Seq"
                  name="ncfB02Seq"
                  type="number"
                  min="1"
                  defaultValue={initialSettings.ncfB02Seq}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Ej: 1 genera B0200000001</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ncfB01Seq" className="text-sm font-semibold">
                Próximo Crédito Fiscal (B01)
              </Label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-500">B01</span>
                <Input
                  id="ncfB01Seq"
                  name="ncfB01Seq"
                  type="number"
                  min="1"
                  defaultValue={initialSettings.ncfB01Seq}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Ej: 1 genera B0100000001</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ncfB15Seq" className="text-sm font-semibold">
                Próximo Gubernamental (B15)
              </Label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-500">B15</span>
                <Input
                  id="ncfB15Seq"
                  name="ncfB15Seq"
                  type="number"
                  min="1"
                  defaultValue={initialSettings.ncfB15Seq}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Ej: 1 genera B1500000001</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="ncfExpiry" className="text-sm font-semibold">
              Fecha de Vencimiento de Secuencia NCF
            </Label>
            <Input
              id="ncfExpiry"
              name="ncfExpiry"
              defaultValue={initialSettings.ncfExpiry || '31/12/2026'}
              placeholder="Ej. 31/12/2026"
            />
            <p className="text-xs text-muted-foreground">Fecha límite otorgada por la DGII para esta serie de comprobantes.</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">
                <Check className="h-4 w-4" /> ¡Configuración guardada exitosamente!
              </span>
            ) : <span />}

            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
              {loading ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
"""

# 3. Contacts Actions (with RNC)
contacts_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getContacts() {
  return await prisma.client.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createContact(formData: FormData) {
  const name = formData.get('name') as string
  const rnc = (formData.get('rnc') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null
  const type = (formData.get('type') as string) || 'CLIENT'

  await prisma.client.create({
    data: { name, rnc, email, phone, address, type }
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

# 4. Contact Dialog (with RNC and Address)
contact_dialog = """
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { createContact } from "@/lib/actions/contacts"

export function ContactDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createContact(formData)
      setOpen(false)
    } catch (err) {
      alert("Error al guardar el contacto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        type="button" 
        onClick={() => setOpen(true)} 
        className="gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Nuevo Contacto
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Añadir Cliente / Proveedor</h2>
                <p className="text-xs text-slate-500">Registra los datos para emisión de facturas y NCF.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Razón Social / Nombre Completo *
                </Label>
                <Input id="name" name="name" placeholder="Ej. Juan Pérez / Distribuidora ABC, SRL" required autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rnc" className="text-xs font-semibold text-slate-700">
                    RNC o Cédula
                  </Label>
                  <Input id="rnc" name="rnc" placeholder="Ej. 131-00000-0" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                    Teléfono
                  </Label>
                  <Input id="phone" name="phone" placeholder="809-555-0000" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  Correo Electrónico
                </Label>
                <Input id="email" name="email" type="email" placeholder="cliente@correo.com" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                  Dirección
                </Label>
                <Input id="address" name="address" placeholder="Calle, Sector, Ciudad" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="type" className="text-xs font-semibold text-slate-700">
                  Tipo de Contacto
                </Label>
                <select 
                  id="type" 
                  name="type" 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                >
                  <option value="CLIENT">Cliente (Le facturo)</option>
                  <option value="PROVIDER">Proveedor (Le compro)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white">
                  {loading ? "Guardando..." : "Guardar Contacto"}
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

# 5. Contacts Page (with RNC column)
contacts_page = """
import { getContacts, deleteContact } from "@/lib/actions/contacts"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ContactDialog } from "@/components/contacts/contact-dialog"
import { Trash2, Users } from "lucide-react"

export default async function ContactsPage() {
  const contacts = await getContacts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Directorio de Contactos</h1>
          <p className="text-sm text-muted-foreground">Clientes y proveedores con su identificación tributaria (RNC / Cédula).</p>
        </div>
        <ContactDialog />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre / Razón Social</TableHead>
              <TableHead>RNC / Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-6 w-6 text-slate-400" />
                    <span>No hay contactos registrados todavía.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-semibold text-slate-900">{contact.name}</TableCell>
                  <TableCell>
                    {contact.rnc ? (
                      <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        {contact.rnc}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sin RNC</span>
                    )}
                  </TableCell>
                  <TableCell>{contact.phone || '-'}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      contact.type === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {contact.type === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={deleteContact.bind(null, contact.id)}>
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

# 6. Invoices Actions (with NCF generator & ITBIS 18%)
invoices_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getInvoices() {
  return await prisma.invoice.findMany({
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
  // 1. Get current sequence and company settings
  let company = await prisma.companySettings.findUnique({ where: { id: 'default' } })
  if (!company) {
    company = await prisma.companySettings.create({
      data: {
        id: 'default',
        name: 'Mi Negocio, SRL',
        rnc: '1-30-00000-0',
        ncfB02Seq: 1,
        ncfB01Seq: 1,
        ncfB15Seq: 1,
        ncfExpiry: '31/12/2026'
      }
    })
  }

  // 2. Generate NCF
  let ncf: string | null = null
  if (data.ncfType === 'B02') {
    ncf = `B02${String(company.ncfB02Seq).padStart(8, '0')}`
    await prisma.companySettings.update({
      where: { id: 'default' },
      data: { ncfB02Seq: { increment: 1 } }
    })
  } else if (data.ncfType === 'B01') {
    ncf = `B01${String(company.ncfB01Seq).padStart(8, '0')}`
    await prisma.companySettings.update({
      where: { id: 'default' },
      data: { ncfB01Seq: { increment: 1 } }
    })
  } else if (data.ncfType === 'B15') {
    ncf = `B15${String(company.ncfB15Seq).padStart(8, '0')}`
    await prisma.companySettings.update({
      where: { id: 'default' },
      data: { ncfB15Seq: { increment: 1 } }
    })
  }

  // 3. Sequential internal number
  const count = await prisma.invoice.count()
  const invoiceNumber = `FAC-${String(count + 1).padStart(4, '0')}`

  // 4. Calculations
  const subtotal = data.items.reduce((acc, item) => acc + item.total, 0)
  const discount = data.discount || 0
  const taxableBase = Math.max(0, subtotal - discount)
  const itbisRate = data.itbisRate !== undefined ? data.itbisRate : 18 // Standard 18% in Rep. Dom.
  const itbis = taxableBase * (itbisRate / 100)
  const total = taxableBase + itbis

  const invoice = await prisma.invoice.create({
    data: {
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

# 7. Invoice Form Component (with NCF Selector, ITBIS 18%, Payment Method)
invoice_form = """
'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, ArrowLeft, AlertCircle, ShieldCheck } from "lucide-react"
import { createInvoice } from "@/lib/actions/invoices"
import Link from "next/link"

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface Client {
  id: string
  name: string
  rnc: string | null
}

interface LineItem {
  id: string
  productId: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export function InvoiceForm({ clients, products }: { clients: Client[], products: Product[] }) {
  const router = useRouter()
  const [clientId, setClientId] = useState(clients[0]?.id || '')
  const [ncfType, setNcfType] = useState('B02') // Default: Consumidor Final
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO')
  const [status, setStatus] = useState('PAID') // Most point of sale is immediate paid
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedClient = clients.find(c => c.id === clientId)

  const [items, setItems] = useState<LineItem[]>([
    {
      id: '1',
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
  ])

  const handleProductSelect = (index: number, prodId: string) => {
    const selected = products.find(p => p.id === prodId)
    const newItems = [...items]
    if (selected) {
      newItems[index].productId = selected.id
      newItems[index].description = selected.name
      newItems[index].unitPrice = selected.price
      newItems[index].total = selected.price * newItems[index].quantity
    } else {
      newItems[index].productId = ''
    }
    setItems(newItems)
  }

  const handleQuantityChange = (index: number, qty: number) => {
    const newItems = [...items]
    newItems[index].quantity = Math.max(1, qty)
    newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    setItems(newItems)
  }

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...items]
    newItems[index].unitPrice = Math.max(0, price)
    newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    setItems(newItems)
  }

  const handleDescChange = (index: number, text: string) => {
    const newItems = [...items]
    newItems[index].description = text
    setItems(newItems)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        productId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxableBase = Math.max(0, subtotal - discount)
  const itbis = taxableBase * 0.18 // 18% ITBIS
  const grandTotal = taxableBase + itbis

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) {
      alert("Por favor selecciona un cliente")
      return
    }

    if (ncfType === 'B01' && (!selectedClient?.rnc || selectedClient.rnc.trim() === '')) {
      alert("Para emitir Factura de Crédito Fiscal (B01), el cliente debe tener un RNC o Cédula registrado. Por favor actualiza el contacto o selecciona Consumidor Final (B02).")
      return
    }

    const validItems = items.filter(i => i.description.trim() !== '')
    if (validItems.length === 0) {
      alert("Debes agregar al menos un producto o concepto a la factura")
      return
    }

    setLoading(true)
    try {
      const invoiceId = await createInvoice({
        clientId,
        ncfType,
        paymentMethod,
        status,
        discount,
        notes,
        itbisRate: 18,
        items: validItems.map(i => ({
          productId: i.productId || undefined,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total
        }))
      })
      router.push(`/invoices/${invoiceId}`)
    } catch (err) {
      alert("Ocurrió un error al emitir la factura")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="outline" size="icon" type="button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emisión de Factura Fiscal (DGII)</h1>
          <p className="text-sm text-muted-foreground">Genera comprobantes válidos con NCF e ITBIS para República Dominicana.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Tipo de Comprobante Fiscal (NCF) y Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {/* Tipo de Comprobante */}
          <div className="space-y-2">
            <Label htmlFor="ncfType" className="font-semibold text-slate-800">
              Tipo de Comprobante *
            </Label>
            <select
              id="ncfType"
              value={ncfType}
              onChange={(e) => setNcfType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-medium"
            >
              <option value="B02">Factura para Consumidor Final (B02)</option>
              <option value="B01">Factura de Crédito Fiscal (B01) - Empresas</option>
              <option value="B15">Comprobante Gubernamental (B15)</option>
              <option value="NONE">Recibo / Cotización interna (Sin NCF)</option>
            </select>
            <p className="text-xs text-slate-500">
              {ncfType === 'B01' && "Exige RNC del cliente para deducción de costos y gastos ante DGII."}
              {ncfType === 'B02' && "Para clientes particulares y ventas de mostrador sin fines de deducción."}
              {ncfType === 'B15' && "Para ventas a instituciones del Estado dominicano."}
            </p>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="client" className="font-semibold text-slate-800">
                Cliente Receptor *
              </Label>
              <Link href="/contacts" target="_blank" className="text-xs text-emerald-600 hover:underline">
                + Crear cliente
              </Link>
            </div>
            <select
              id="client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              required
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.rnc ? `(RNC: ${c.rnc})` : '(Sin RNC)'}
                </option>
              ))}
            </select>
            {ncfType === 'B01' && selectedClient && !selectedClient.rnc && (
              <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                Este cliente no tiene RNC registrado. La DGII exige RNC para emitir B01.
              </div>
            )}
          </div>

          {/* Forma de Pago */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="font-semibold text-slate-800">
              Método de Pago
            </Label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value)
                if (e.target.value === 'CREDITO') {
                  setStatus('PENDING')
                } else {
                  setStatus('PAID')
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia / Depósito</option>
              <option value="TARJETA">Tarjeta de Débito / Crédito</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CREDITO">Venta a Crédito (Por Cobrar)</option>
            </select>
          </div>

          {/* Estado de Cobro */}
          <div className="space-y-2">
            <Label htmlFor="status" className="font-semibold text-slate-800">
              Estado de la Factura
            </Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-medium"
            >
              <option value="PAID">Cobrada / Pagada al Instante</option>
              <option value="PENDING">Pendiente de Cobro (Cuenta por Cobrar)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Artículos y Productos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Detalle de Bienes y Servicios</CardTitle>
            <p className="text-xs text-muted-foreground">Agrega productos del catálogo o escribe conceptos libres.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Añadir Línea
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Producto del Catálogo</TableHead>
                  <TableHead>Concepto / Detalle</TableHead>
                  <TableHead className="w-[90px] text-right">Cant.</TableHead>
                  <TableHead className="w-[120px] text-right">Precio RD$</TableHead>
                  <TableHead className="w-[120px] text-right">Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="">(Elegir del catálogo)</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (RD${p.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => handleDescChange(index, e.target.value)}
                        placeholder="Descripción del ítem"
                        className="h-9"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                        className="h-9 text-right font-medium"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                        className="h-9 text-right font-medium"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      RD${item.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Desglose Fiscal con ITBIS */}
          <div className="flex justify-end pt-4">
            <div className="w-80 space-y-2 border rounded-xl p-4 bg-slate-50/50">
              <div className="flex justify-between text-sm text-slate-700">
                <span>Subtotal Gravado:</span>
                <span className="font-semibold font-mono">RD${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <Label htmlFor="discount" className="text-xs">Descuento (RD$):</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-8 w-28 text-right font-mono text-xs"
                />
              </div>
              <div className="flex justify-between text-sm text-slate-700">
                <span>ITBIS (18%):</span>
                <span className="font-semibold font-mono text-blue-600">+RD${itbis.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold text-slate-900 border-t pt-2">
                <span>TOTAL RD$:</span>
                <span className="text-emerald-600 font-mono">RD${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones / Términos de Pago</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Transferencia Banco Popular Cta #... / Pago a 30 días"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Link href="/invoices">
          <Button variant="outline" type="button">Cancelar</Button>
        </Link>
        <Button type="submit" disabled={loading} className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
          {loading ? "Emitiendo NCF..." : "Emitir Factura con NCF"}
        </Button>
      </div>
    </form>
  )
}
"""

# 8. Invoices List Page (with NCF and Type)
invoices_page = """
import { getInvoices, deleteInvoice } from "@/lib/actions/invoices"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Plus, Printer, Trash2, ReceiptText } from "lucide-react"

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facturación y NCF</h1>
          <p className="text-sm text-muted-foreground">Comprobantes fiscales emitidos según normativas de la DGII.</p>
        </div>
        <Link href="/invoices/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold">
            <Plus className="h-4 w-4" />
            Nueva Factura con NCF
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Factura</TableHead>
              <TableHead>Comprobante Fiscal (NCF)</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total RD$</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ReceiptText className="h-6 w-6 text-slate-400" />
                    <span>No has emitido facturas aún.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-semibold text-slate-600">{inv.number}</TableCell>
                  <TableCell>
                    {inv.ncf ? (
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border">
                        {inv.ncf}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sin NCF</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{inv.client.name}</TableCell>
                  <TableCell className="text-xs font-semibold uppercase text-slate-600">{inv.paymentMethod}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status === 'PAID' ? 'Cobrada' : 'Pendiente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-base font-mono">
                    RD${inv.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/invoices/${inv.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Printer className="h-3.5 w-3.5" />
                        Imprimir
                      </Button>
                    </Link>
                    <form action={deleteInvoice.bind(null, inv.id)} className="inline-block">
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

# 9. Printable Invoice (DGII standard layout)
invoice_detail_page = """
import { getInvoiceById, markInvoicePaid } from "@/lib/actions/invoices"
import { getCompanySettings } from "@/lib/actions/settings"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PrintButton } from "./print-button"
import { ArrowLeft, Check, CheckCircle2, ShieldCheck } from "lucide-react"
import Link from "next/link"

function getNcfTypeName(type: string) {
  switch (type) {
    case 'B01': return 'FACTURA DE CRÉDITO FISCAL'
    case 'B02': return 'FACTURA PARA CONSUMIDOR FINAL'
    case 'B15': return 'COMPROBANTE GUBERNAMENTAL'
    default: return 'COMPROBANTE INTERNO'
  }
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoiceById(id)
  const company = await getCompanySettings()

  if (!invoice) {
    notFound()
  }

  const ncfTitle = getNcfTypeName(invoice.ncfType)

  return (
    <div className="max-w-3xl mx-auto w-full py-6 space-y-6">
      {/* Botones de acción (ocultos al imprimir) */}
      <div className="print:hidden flex items-center justify-between">
        <Link href="/invoices">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Facturas
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {invoice.status === 'PENDING' && (
            <form action={markInvoicePaid.bind(null, invoice.id)}>
              <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700 gap-1 font-semibold">
                <Check className="h-4 w-4" />
                Marcar como Cobrada
              </Button>
            </form>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Hoja de Factura Oficial Impresa */}
      <div className="bg-white border rounded-xl p-8 md:p-12 shadow-sm print:shadow-none print:border-none print:p-0 text-slate-900">
        
        {/* Encabezado: Emisor y Recuadro Fiscal */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          {/* Datos del Emisor */}
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{company.name}</h1>
            <p className="text-sm font-bold text-slate-800">RNC: {company.rnc || '1-30-00000-0'}</p>
            {company.address && <p className="text-xs text-slate-600 max-w-sm">{company.address}</p>}
            {company.phone && <p className="text-xs text-slate-600">Tel: {company.phone}</p>}
            {company.email && <p className="text-xs text-slate-600">Correo: {company.email}</p>}
          </div>

          {/* Bloque Fiscal DGII */}
          <div className="text-right border-2 border-slate-900 p-4 rounded-lg bg-slate-50/50 min-w-[280px]">
            <p className="text-xs font-black uppercase text-slate-700 tracking-wider mb-1">{ncfTitle}</p>
            {invoice.ncf ? (
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-500 uppercase">NCF:</span>
                <p className="font-mono text-xl font-black text-slate-900 tracking-wider">{invoice.ncf}</p>
                {invoice.ncfExpiry && (
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">Válido hasta: {invoice.ncfExpiry}</p>
                )}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-500">Documento no fiscal</p>
            )}
            <div className="mt-2 pt-2 border-t border-slate-300 text-xs flex justify-between font-semibold">
              <span className="text-slate-500">N° Factura:</span>
              <span>{invoice.number}</span>
            </div>
            <div className="text-xs flex justify-between font-semibold">
              <span className="text-slate-500">Fecha:</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Condiciones */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b text-sm">
          <div>
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Facturado a:</span>
            <p className="text-base font-bold text-slate-900 mt-1">{invoice.client.name}</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              RNC / Cédula: <span className="font-mono">{invoice.client.rnc || 'Consumidor Final'}</span>
            </p>
            {invoice.client.phone && <p className="text-xs text-slate-600">Tel: {invoice.client.phone}</p>}
            {invoice.client.address && <p className="text-xs text-slate-600">{invoice.client.address}</p>}
          </div>

          <div className="text-right flex flex-col justify-center space-y-1">
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Método de Pago: </span>
              <span className="font-bold uppercase text-slate-800">{invoice.paymentMethod}</span>
            </div>
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Estado: </span>
              {invoice.status === 'PAID' ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">PAGADA AL CONTADO</span>
              ) : (
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">PENDIENTE DE PAGO (CRÉDITO)</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de Artículos / Ítems */}
        <div className="py-6">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-slate-900">
                <TableHead className="font-black text-slate-900 text-xs uppercase">Descripción del Bien o Servicio</TableHead>
                <TableHead className="text-center font-black text-slate-900 text-xs uppercase w-[80px]">Cant.</TableHead>
                <TableHead className="text-right font-black text-slate-900 text-xs uppercase w-[130px]">Precio Unit. RD$</TableHead>
                <TableHead className="text-right font-black text-slate-900 text-xs uppercase w-[130px]">Importe RD$</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id} className="border-b border-slate-200">
                  <TableCell className="font-medium text-slate-900">{item.description}</TableCell>
                  <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono">RD${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold font-mono">RD${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totales con desglose de ITBIS */}
        <div className="flex justify-end pt-4 border-t-2 border-slate-900">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">RD${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Descuento:</span>
                <span className="font-mono font-medium text-rose-600">-RD${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700">
              <span>ITBIS (18%):</span>
              <span className="font-mono font-medium">RD${invoice.itbis.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-400 pt-2">
              <span>TOTAL A PAGAR:</span>
              <span className="font-mono text-emerald-700">RD${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {invoice.notes && (
          <div className="mt-8 pt-4 border-t text-xs text-slate-600">
            <p className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">Observaciones / Condiciones:</p>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Leyenda legal al pie */}
        <div className="mt-12 pt-4 border-t text-center space-y-1">
          <p className="text-xs font-semibold text-slate-700">{company.slogan || '¡Gracias por su compra!'}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Original: Cliente • Copia: Emisor</p>
        </div>
      </div>
    </div>
  )
}
"""

write_file("src/lib/actions/settings.ts", settings_actions)
write_file("src/app/(dashboard)/settings/settings-form.tsx", settings_form)

write_file("src/lib/actions/contacts.ts", contacts_actions)
write_file("src/components/contacts/contact-dialog.tsx", contact_dialog)
write_file("src/app/(dashboard)/contacts/page.tsx", contacts_page)

write_file("src/lib/actions/invoices.ts", invoices_actions)
write_file("src/app/(dashboard)/invoices/new/invoice-form.tsx", invoice_form)
write_file("src/app/(dashboard)/invoices/page.tsx", invoices_page)
write_file("src/app/(dashboard)/invoices/[id]/page.tsx", invoice_detail_page)
