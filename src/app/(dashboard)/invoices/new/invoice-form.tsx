'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, ArrowLeft, AlertCircle, ShieldCheck, Search, X } from "lucide-react"
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

  const [productSearch, setProductSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const searchResults = productSearch.trim() === ''
    ? []
    : products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase().trim()))

  const handleAddFromSearch = (product: Product) => {
    const newItems = [...items]
    if (newItems.length === 1 && !newItems[0].description && !newItems[0].productId) {
      newItems[0] = {
        id: '1',
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.price,
        hasItbis: product.hasItbis !== false,
        total: product.price
      }
    } else {
      newItems.push({
        id: String(Date.now()),
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.price,
        hasItbis: product.hasItbis !== false,
        total: product.price
      })
    }
    setItems(newItems)
    setProductSearch('')
    setSearchOpen(false)
  }

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
          {/* BARRA DE BÚSQUEDA RÁPIDA DE PRODUCTOS PARA FACTURAR */}
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                <Input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="🔍 Buscar producto en el catálogo por nombre para añadir a la factura..."
                  className="pl-9 pr-9 h-10 border-emerald-300 focus-visible:ring-emerald-500 bg-emerald-50/20 text-sm font-medium"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => { setProductSearch(''); setSearchOpen(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="h-10 text-xs font-bold text-slate-700 hover:bg-slate-50 border-slate-300 shrink-0"
              >
                <Plus className="h-4 w-4 mr-1 text-emerald-600" />
                + Añadir Línea Libre
              </Button>
            </div>

            {/* Resultados flotantes de búsqueda */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-11 z-50 bg-white border-2 border-emerald-300 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 bg-emerald-50 text-[11px] font-bold text-emerald-800 flex justify-between items-center">
                  <span>Productos encontrados ({searchResults.length}):</span>
                  <span className="text-[10px] text-emerald-600">Haz clic en un producto para agregarlo</span>
                </div>
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleAddFromSearch(p)}
                    className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        Stock: {p.stock} unid. • {p.hasItbis !== false ? 'Gravado ITBIS (18%)' : 'Exento (0%)'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 text-sm">RD${p.price.toFixed(2)}</span>
                      <span className="block text-[11px] text-emerald-600 font-bold">+ Agregar a la factura</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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