import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

# 1. Product Actions
products_actions = """
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProducts() {
  return await prisma.product.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const stock = parseInt(formData.get('stock') as string) || 0

  await prisma.product.create({
    data: { name, description, price, stock }
  })

  revalidatePath('/products')
  revalidatePath('/invoices/new')
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id }
  })
  revalidatePath('/products')
}
"""

# 2. Product Dialog
product_dialog = """
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createProduct } from "@/lib/actions/products"

export function ProductDialog() {
  const [open, setOpen] = useState(false)

  async function onSubmit(formData: FormData) {
    await createProduct(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Añadir Producto / Servicio</DialogTitle>
            <DialogDescription>
              Crea un producto o servicio para facturar a tus clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" name="name" placeholder="Ej. Computadora portátil" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Precio ($)
              </Label>
              <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Cantidad
              </Label>
              <Input id="stock" name="stock" type="number" defaultValue="1" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Detalle
              </Label>
              <Input id="description" name="description" placeholder="Descripción breve" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Producto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
"""

# 3. Products Page
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
          <h1 className="text-2xl font-semibold">Catálogo de Productos</h1>
          <p className="text-sm text-muted-foreground">Administra tus artículos, servicios, precios y stock.</p>
        </div>
        <ProductDialog />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Stock Disponible</TableHead>
              <TableHead className="text-right">Precio Unitario</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-6 w-6 text-slate-400" />
                    <span>No hay productos registrados todavía.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.description || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.stock > 5 ? 'bg-emerald-100 text-emerald-800' : p.stock > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.stock} unid.
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">${p.price.toFixed(2)}</TableCell>
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

# 4. Invoices Server Actions
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
  notes?: string
  status: string
  items: InvoiceItemInput[]
}) {
  const count = await prisma.invoice.count()
  const invoiceNumber = `FAC-${String(count + 1).padStart(4, '0')}`

  const subtotal = data.items.reduce((acc, item) => acc + item.total, 0)
  const total = subtotal

  const invoice = await prisma.invoice.create({
    data: {
      number: invoiceNumber,
      clientId: data.clientId,
      status: data.status,
      notes: data.notes,
      subtotal,
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
          description: `Factura ${invoiceNumber}`
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
          stock: {
            decrement: item.quantity
          }
        }
      }).catch(() => {})
    }
  }

  revalidatePath('/invoices')
  revalidatePath('/transactions')
  revalidatePath('/products')
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

# 5. Invoices List Page
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
          <h1 className="text-2xl font-semibold">Facturación</h1>
          <p className="text-sm text-muted-foreground">Genera, consulta e imprime facturas para tus clientes.</p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ReceiptText className="h-6 w-6 text-slate-400" />
                    <span>No has emitido facturas aún.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-bold">{inv.number}</TableCell>
                  <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{inv.client.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status === 'PAID' ? 'Pagada' : 'Pendiente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-base">
                    ${inv.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/invoices/${inv.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Printer className="h-3.5 w-3.5" />
                        Ver / Imprimir
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

# 6. New Invoice Page (Creator)
new_invoice_page = """
import { getContacts } from "@/lib/actions/contacts"
import { getProducts } from "@/lib/actions/products"
import { InvoiceForm } from "./invoice-form"

export default async function NewInvoicePage() {
  const allContacts = await getContacts()
  const clients = allContacts.filter(c => c.type === 'CLIENT')
  const products = await getProducts()

  return (
    <div className="max-w-4xl mx-auto w-full py-4">
      <InvoiceForm clients={clients.length > 0 ? clients : allContacts} products={products} />
    </div>
  )
}
"""

# 7. Invoice Form Component
invoice_form = """
'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
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
  const [status, setStatus] = useState('PENDING')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

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

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) {
      alert("Por favor selecciona un cliente")
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
        status,
        notes,
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
      alert("Ocurrió un error al crear la factura")
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
          <h1 className="text-2xl font-semibold">Nueva Factura</h1>
          <p className="text-sm text-muted-foreground">Genera el comprobante de venta para tu cliente.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del Cliente y Estado</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <select
              id="client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              required
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado del Pago</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="PENDING">Por Cobrar (Pendiente)</option>
              <option value="PAID">Cobrado / Pagado al contado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Productos y Servicios</CardTitle>
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
                  <TableHead className="w-[280px]">Producto del Catálogo</TableHead>
                  <TableHead>Concepto / Detalle</TableHead>
                  <TableHead className="w-[100px] text-right">Cantidad</TableHead>
                  <TableHead className="w-[120px] text-right">Precio ($)</TableHead>
                  <TableHead className="w-[120px] text-right">Total</TableHead>
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
                            {p.name} (${p.price.toFixed(2)})
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
                        className="h-9 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                        className="h-9 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${item.total.toFixed(2)}
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

          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-2 border-t pt-4">
              <div className="flex justify-between text-base font-bold">
                <span>Total a Cobrar:</span>
                <span className="text-xl text-emerald-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Términos de la Factura (Opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Transferir a la cuenta corriente N° ..., gracias por su preferencia."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Link href="/invoices">
          <Button variant="outline" type="button">Cancelar</Button>
        </Link>
        <Button type="submit" disabled={loading} className="px-8">
          {loading ? "Emitiendo..." : "Generar e Imprimir Factura"}
        </Button>
      </div>
    </form>
  )
}
"""

# 8. Invoice Printable View
invoice_detail_page = """
import { getInvoiceById, markInvoicePaid } from "@/lib/actions/invoices"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PrintButton } from "./print-button"
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoiceById(id)

  if (!invoice) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-6 space-y-6">
      {/* Action buttons (hidden during print) */}
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
              <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700 gap-1">
                <Check className="h-4 w-4" />
                Marcar como Pagada
              </Button>
            </form>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white border rounded-xl p-8 md:p-12 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">FACTURA DE VENTA</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">{invoice.number}</p>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-lg text-slate-900">Mi Negocio</h2>
            <p className="text-xs text-slate-500">Gestión Comercial & Servicios</p>
            <p className="text-xs text-slate-500 mt-1">Fecha: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Client & Status info */}
        <div className="grid grid-cols-2 gap-8 py-8 border-b">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Facturado a:</span>
            <p className="text-lg font-bold text-slate-900 mt-1">{invoice.client.name}</p>
            {invoice.client.email && <p className="text-sm text-slate-600">{invoice.client.email}</p>}
            {invoice.client.phone && <p className="text-sm text-slate-600">Tel: {invoice.client.phone}</p>}
            {invoice.client.address && <p className="text-sm text-slate-600">{invoice.client.address}</p>}
          </div>
          <div className="text-right flex flex-col items-end justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado:</span>
            {invoice.status === 'PAID' ? (
              <span className="inline-flex items-center gap-1 mt-1 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full text-sm">
                <CheckCircle2 className="h-4 w-4" /> PAGADA
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-1 text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full text-sm">
                PENDIENTE DE PAGO
              </span>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2">
                <TableHead className="font-bold text-slate-900">Descripción</TableHead>
                <TableHead className="text-center font-bold text-slate-900 w-[100px]">Cantidad</TableHead>
                <TableHead className="text-right font-bold text-slate-900 w-[120px]">Precio Unit.</TableHead>
                <TableHead className="text-right font-bold text-slate-900 w-[120px]">Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-800">{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-4 border-t">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal:</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-slate-900 border-t pt-2">
              <span>Total:</span>
              <span className="text-emerald-600">${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-6 border-t text-xs text-slate-500">
            <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">Términos y Observaciones:</p>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-400">
          <p>¡Gracias por su preferencia y confianza!</p>
        </div>
      </div>
    </div>
  )
}
"""

# 9. Print Button Client Component
print_button = """
'use client'

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="gap-2 bg-slate-900 hover:bg-slate-800">
      <Printer className="h-4 w-4" />
      Imprimir / Guardar PDF
    </Button>
  )
}
"""

# 10. Sidebar with Products & Invoices
sidebar = """
import Link from 'next/link'
import { Home, Users, CreditCard, Package, ReceiptText } from 'lucide-react'

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-50/40">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
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
          <Link
            href="/invoices"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100 font-semibold text-emerald-700"
          >
            <ReceiptText className="h-4 w-4 text-emerald-600" />
            Facturación
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <Package className="h-4 w-4" />
            Productos
          </Link>
          <Link
            href="/contacts"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <Users className="h-4 w-4" />
            Contactos
          </Link>
          <Link
            href="/transactions"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <CreditCard className="h-4 w-4" />
            Cuentas (Cobros/Pagos)
          </Link>
        </nav>
      </div>
    </div>
  )
}
"""

# 11. Topbar with Products & Invoices
topbar = """
'use client'

import { Button } from "@/components/ui/button"
import { CircleUser, Menu, Home, Users, CreditCard, Package, ReceiptText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { signOut } from "next-auth/react"
import Link from "next/link"

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-slate-50/40 px-4 lg:h-[60px] lg:px-6 print:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menú</span>
          </Button>
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
              Facturación
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
              Contactos
            </Link>
            <Link
              href="/transactions"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <CreditCard className="h-4 w-4" />
              Cuentas
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Menú de usuario</span>
          </Button>
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

write_file("src/lib/actions/products.ts", products_actions)
write_file("src/components/products/product-dialog.tsx", product_dialog)
write_file("src/app/(dashboard)/products/page.tsx", products_page)

write_file("src/lib/actions/invoices.ts", invoices_actions)
write_file("src/app/(dashboard)/invoices/page.tsx", invoices_page)
write_file("src/app/(dashboard)/invoices/new/page.tsx", new_invoice_page)
write_file("src/app/(dashboard)/invoices/new/invoice-form.tsx", invoice_form)
write_file("src/app/(dashboard)/invoices/[id]/page.tsx", invoice_detail_page)
write_file("src/app/(dashboard)/invoices/[id]/print-button.tsx", print_button)

write_file("src/components/layout/sidebar.tsx", sidebar)
write_file("src/components/layout/topbar.tsx", topbar)
