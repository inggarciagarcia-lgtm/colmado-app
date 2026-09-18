import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

# 1. Products Actions
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
  const hasItbis = formData.get('hasItbis') !== 'false'

  await prisma.product.create({
    data: { 
      companyId: company.id,
      name, 
      description, 
      price, 
      stock,
      hasItbis
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

# 2. Product Dialog with ITBIS selector
product_dialog = """
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { createProduct } from "@/lib/actions/products"

export function ProductDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasItbis, setHasItbis] = useState('true')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createProduct(formData)
      setOpen(false)
    } catch (err) {
      alert("Error al guardar el producto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        type="button" 
        onClick={() => setOpen(true)} 
        className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm font-semibold"
      >
        <Plus className="h-4 w-4" />
        Nuevo Producto
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Añadir Producto / Servicio</h2>
                <p className="text-xs text-slate-500">Configura nombre, precio, stock e impuesto ITBIS.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Nombre del Producto o Servicio *
                </Label>
                <Input id="name" name="name" placeholder="Ej. Laptop HP / Leche / Asesoría" required autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="price" className="text-xs font-semibold text-slate-700">
                    Precio Unitario (RD$) *
                  </Label>
                  <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="0.00" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stock" className="text-xs font-semibold text-slate-700">
                    Cantidad en Stock *
                  </Label>
                  <Input id="stock" name="stock" type="number" min="0" defaultValue="1" required />
                </div>
              </div>

              {/* Selector de ITBIS */}
              <div className="space-y-1">
                <Label htmlFor="hasItbis" className="text-xs font-semibold text-slate-700">
                  Tratamiento Fiscal (ITBIS) *
                </Label>
                <select
                  id="hasItbis"
                  name="hasItbis"
                  value={hasItbis}
                  onChange={(e) => setHasItbis(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-medium"
                >
                  <option value="true">Gravado con ITBIS (18%)</option>
                  <option value="false">Exento de ITBIS (0% - No lleva ITBIS)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  {hasItbis === 'true' 
                    ? "Al facturarlo, el sistema calculará automáticamente el 18% de ITBIS."
                    : "Ideal para productos de la canasta básica o servicios exentos por la DGII."}
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                  Detalle / Descripción
                </Label>
                <Input id="description" name="description" placeholder="Descripción breve del producto" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {loading ? "Guardando..." : "Guardar Producto"}
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

# 3. Products Page with ITBIS column
products_page = """
import { getProducts, deleteProduct } from "@/lib/actions/products"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProductDialog } from "@/components/products/product-dialog"
import { Trash2, Package } from "lucide-react"

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Catálogo de Productos e Inventario</h1>
          <p className="text-sm text-muted-foreground">Administra tus artículos, precios, stock y estado de ITBIS (Gravado o Exento).</p>
        </div>
        <ProductDialog />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Impuesto ITBIS</TableHead>
              <TableHead className="text-right">Stock Disponible</TableHead>
              <TableHead className="text-right">Precio Unitario RD$</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-6 w-6 text-slate-400" />
                    <span>No hay productos registrados todavía.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold text-slate-900">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.description || '-'}</TableCell>
                  <TableCell>
                    {p.hasItbis ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800">
                        ITBIS 18%
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 border">
                        Exento (0%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.stock > 5 ? 'bg-emerald-100 text-emerald-800' : p.stock > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.stock} unid.
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono text-base">RD${p.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteProduct.bind(null, p.id)}>
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

# 4. Invoices Server Actions with hasItbis calculations
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
  hasItbis: boolean
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

  // 3. Precise ITBIS Calculations: Separating Gravado vs Exento
  const subtotal = data.items.reduce((acc, item) => acc + item.total, 0)
  const taxableSubtotal = data.items.filter(i => i.hasItbis).reduce((acc, item) => acc + item.total, 0)
  const exemptSubtotal = data.items.filter(i => !i.hasItbis).reduce((acc, item) => acc + item.total, 0)
  
  const discount = data.discount || 0
  // Apply discount proportionally to taxable base if exists
  const discountOnTaxable = subtotal > 0 ? (taxableSubtotal / subtotal) * discount : 0
  const netTaxable = Math.max(0, taxableSubtotal - discountOnTaxable)

  const itbisRate = data.itbisRate !== undefined ? data.itbisRate : 18
  const itbis = netTaxable * (itbisRate / 100)
  const total = Math.max(0, subtotal - discount) + itbis

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
      taxableSubtotal,
      exemptSubtotal,
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
          hasItbis: item.hasItbis,
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

# 5. Invoice Form Component with per-item ITBIS toggle
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
  hasItbis: boolean
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
  hasItbis: boolean
  total: number
}

export function InvoiceForm({ clients, products }: { clients: Client[], products: Product[] }) {
  const router = useRouter()
  const [clientId, setClientId] = useState(clients[0]?.id || '')
  const [ncfType, setNcfType] = useState('B02')
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO')
  const [status, setStatus] = useState('PAID')
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
      hasItbis: true,
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
      newItems[index].hasItbis = selected.hasItbis !== false
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

  const handleItbisToggle = (index: number, value: boolean) => {
    const newItems = [...items]
    newItems[index].hasItbis = value
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
        hasItbis: true,
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
  const taxableSubtotal = items.filter(i => i.hasItbis).reduce((sum, item) => sum + item.total, 0)
  const exemptSubtotal = items.filter(i => !i.hasItbis).reduce((sum, item) => sum + item.total, 0)

  const discountOnTaxable = subtotal > 0 ? (taxableSubtotal / subtotal) * discount : 0
  const netTaxable = Math.max(0, taxableSubtotal - discountOnTaxable)
  const itbis = netTaxable * 0.18 // 18% ITBIS
  const grandTotal = Math.max(0, subtotal - discount) + itbis

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) {
      alert("Por favor selecciona un cliente")
      return
    }

    if (ncfType === 'B01' && (!selectedClient?.rnc || selectedClient.rnc.trim() === '')) {
      alert("Para emitir Factura de Crédito Fiscal (B01), el cliente debe tener un RNC o Cédula registrado.")
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
          hasItbis: i.hasItbis,
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
          <p className="text-sm text-muted-foreground">Genera comprobantes con NCF, soporte de productos con o sin ITBIS (Exentos).</p>
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

          {/* Estado */}
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

      {/* Artículos y Productos con ITBIS switch */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Detalle de Bienes y Servicios</CardTitle>
            <p className="text-xs text-muted-foreground">Indica si cada ítem lleva ITBIS (18%) o si es Exento (0%).</p>
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
                  <TableHead className="w-[230px]">Producto del Catálogo</TableHead>
                  <TableHead>Concepto / Detalle</TableHead>
                  <TableHead className="w-[110px]">Impuesto</TableHead>
                  <TableHead className="w-[80px] text-right">Cant.</TableHead>
                  <TableHead className="w-[110px] text-right">Precio RD$</TableHead>
                  <TableHead className="w-[110px] text-right">Subtotal</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
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
                            {p.name} (RD${p.price.toFixed(2)}) {p.hasItbis ? '[ITBIS 18%]' : '[Exento]'}
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
                      <select
                        value={item.hasItbis ? '18' : '0'}
                        onChange={(e) => handleItbisToggle(index, e.target.value === '18')}
                        className={`flex h-9 w-full rounded-md border text-xs px-1 font-bold ${
                          item.hasItbis ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <option value="18">ITBIS (18%)</option>
                        <option value="0">Exento (0%)</option>
                      </select>
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

          {/* Desglose Fiscal con ITBIS y Exento */}
          <div className="flex justify-end pt-4">
            <div className="w-80 space-y-2 border rounded-xl p-4 bg-slate-50/50">
              <div className="flex justify-between text-xs text-slate-700">
                <span>Subtotal Gravado (con ITBIS):</span>
                <span className="font-semibold font-mono">RD${taxableSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>Subtotal Exento (sin ITBIS):</span>
                <span className="font-semibold font-mono">RD${exemptSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700">
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
              <div className="flex justify-between text-sm text-slate-700 border-t pt-1">
                <span className="font-medium">ITBIS (18% sobre gravado):</span>
                <span className="font-bold font-mono text-blue-600">+RD${itbis.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold text-slate-900 border-t pt-2">
                <span>TOTAL A PAGAR:</span>
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

# 6. Printable Invoice with ITBIS vs Exento breakdown
invoice_detail_page = """
import { getInvoiceById, markInvoicePaid } from "@/lib/actions/invoices"
import { getActiveCompany } from "@/lib/actions/companies"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PrintButton } from "./print-button"
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react"
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
  const company = await getActiveCompany()

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
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{invoice.company?.name || company.name}</h1>
            <p className="text-sm font-bold text-slate-800">RNC: {invoice.company?.rnc || company.rnc || '1-30-00000-0'}</p>
            {(invoice.company?.address || company.address) && (
              <p className="text-xs text-slate-600 max-w-sm">{invoice.company?.address || company.address}</p>
            )}
            {(invoice.company?.phone || company.phone) && (
              <p className="text-xs text-slate-600">Tel: {invoice.company?.phone || company.phone}</p>
            )}
          </div>

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
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">PENDIENTE DE PAGO</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de Artículos */}
        <div className="py-6">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-slate-900">
                <TableHead className="font-black text-slate-900 text-xs uppercase">Descripción</TableHead>
                <TableHead className="text-center font-black text-slate-900 text-xs uppercase w-[70px]">ITBIS</TableHead>
                <TableHead className="text-center font-black text-slate-900 text-xs uppercase w-[70px]">Cant.</TableHead>
                <TableHead className="text-right font-black text-slate-900 text-xs uppercase w-[120px]">Precio RD$</TableHead>
                <TableHead className="text-right font-black text-slate-900 text-xs uppercase w-[120px]">Importe RD$</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id} className="border-b border-slate-200">
                  <TableCell className="font-medium text-slate-900">{item.description}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.hasItbis ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.hasItbis ? '18%' : 'E'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono">RD${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold font-mono">RD${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totales con desglose exacto DGII */}
        <div className="flex justify-end pt-4 border-t-2 border-slate-900">
          <div className="w-80 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Monto Gravado (con ITBIS):</span>
              <span className="font-mono font-medium">RD${invoice.taxableSubtotal.toFixed(2)}</span>
            </div>
            {invoice.exemptSubtotal > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Monto Exento (sin ITBIS):</span>
                <span className="font-mono font-medium">RD${invoice.exemptSubtotal.toFixed(2)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Descuento Otorgado:</span>
                <span className="font-mono font-medium text-rose-600">-RD${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 border-t pt-1">
              <span>ITBIS (18%):</span>
              <span className="font-mono font-medium text-blue-600">RD${invoice.itbis.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-400 pt-2">
              <span>TOTAL A PAGAR:</span>
              <span className="font-mono text-emerald-700">RD${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Leyenda legal al pie */}
        <div className="mt-12 pt-4 border-t text-center space-y-1">
          <p className="text-xs font-semibold text-slate-700">{invoice.company?.slogan || company.slogan || '¡Gracias por su compra!'}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Original: Cliente • Copia: Emisor • E = Exento de ITBIS</p>
        </div>
      </div>
    </div>
  )
}
"""

write_file("src/lib/actions/products.ts", products_actions)
write_file("src/components/products/product-dialog.tsx", product_dialog)
write_file("src/app/(dashboard)/products/page.tsx", products_page)
write_file("src/lib/actions/invoices.ts", invoices_actions)
write_file("src/app/(dashboard)/invoices/new/invoice-form.tsx", invoice_form)
write_file("src/app/(dashboard)/invoices/[id]/page.tsx", invoice_detail_page)
