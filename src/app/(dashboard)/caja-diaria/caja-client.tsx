'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Wallet, 
  ShoppingCart, 
  UserCheck, 
  Plus, 
  Trash2, 
  Printer, 
  Calendar, 
  DollarSign, 
  ArrowDownRight, 
  Coffee,
  Search,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createCashMovement, deleteCashMovement } from '@/lib/actions/cash-movements'
import { QuickExpenseBar } from '@/components/cash/quick-expense-bar'

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface CashItemRow {
  productId: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  addToStock: boolean
}

export function CajaDiariaClient({
  initialData,
  products,
  currentDate
}: {
  initialData: any
  products: Product[]
  currentDate: string
}) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(currentDate)
  const [activeTab, setActiveTab] = useState<'COMPRA_PRODUCTOS' | 'PAGO_EMPLEADOS' | 'OTROS_GASTOS' | 'FONDO_INICIAL'>('COMPRA_PRODUCTOS')
  const [loading, setLoading] = useState(false)

  // Search product states
  const [productSearch, setProductSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  // Form states
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [responsible, setResponsible] = useState('')
  const [notes, setNotes] = useState('')

  // Product purchase line items
  const [productItems, setProductItems] = useState<CashItemRow[]>([
    { productId: '', description: '', quantity: 1, unitPrice: 0, total: 0, addToStock: false }
  ])

  const searchResults = productSearch.trim() === ''
    ? []
    : products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase().trim()))

  const handleAddFromSearch = (product: Product) => {
    const updated = [...productItems]
    if (updated.length === 1 && !updated[0].description && !updated[0].productId) {
      updated[0] = {
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
        addToStock: true
      }
    } else {
      updated.push({
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
        addToStock: true
      })
    }
    setProductItems(updated)
    updateTotalFromItems(updated)
    setProductSearch('')
    setSearchOpen(false)
  }

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
    router.push(`/caja-diaria?date=${newDate}`)
  }

  // Product line items handlers
  const handleProductSelect = (index: number, prodId: string) => {
    const updated = [...productItems]
    const prod = products.find(p => p.id === prodId)
    if (prod) {
      updated[index].productId = prod.id
      updated[index].description = prod.name
      updated[index].unitPrice = prod.price
      updated[index].total = prod.price * updated[index].quantity
      updated[index].addToStock = true
    } else {
      updated[index].productId = ''
    }
    setProductItems(updated)
    updateTotalFromItems(updated)
  }

  const handleItemDescChange = (index: number, desc: string) => {
    const updated = [...productItems]
    updated[index].description = desc
    setProductItems(updated)
  }

  const handleItemQtyChange = (index: number, qty: number) => {
    const updated = [...productItems]
    updated[index].quantity = Math.max(0.01, qty)
    updated[index].total = updated[index].quantity * updated[index].unitPrice
    setProductItems(updated)
    updateTotalFromItems(updated)
  }

  const handleItemPriceChange = (index: number, price: number) => {
    const updated = [...productItems]
    updated[index].unitPrice = Math.max(0, price)
    updated[index].total = updated[index].quantity * updated[index].unitPrice
    setProductItems(updated)
    updateTotalFromItems(updated)
  }

  const handleItemStockToggle = (index: number, add: boolean) => {
    const updated = [...productItems]
    updated[index].addToStock = add
    setProductItems(updated)
  }

  const addProductItem = () => {
    setProductItems([
      ...productItems,
      { productId: '', description: '', quantity: 1, unitPrice: 0, total: 0, addToStock: false }
    ])
  }

  const removeProductItem = (index: number) => {
    if (productItems.length === 1) return
    const updated = productItems.filter((_, i) => i !== index)
    setProductItems(updated)
    updateTotalFromItems(updated)
  }

  const updateTotalFromItems = (items: CashItemRow[]) => {
    const sum = items.reduce((acc, curr) => acc + curr.total, 0)
    setAmount(sum.toFixed(2))
  }

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setResponsible('')
    setNotes('')
    setProductSearch('')
    setSearchOpen(false)
    setProductItems([
      { productId: '', description: '', quantity: 1, unitPrice: 0, total: 0, addToStock: false }
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.')
      return
    }

    let finalDesc = description.trim()
    let itemsToSave = undefined

    if (activeTab === 'COMPRA_PRODUCTOS') {
      const validItems = productItems.filter(i => i.description.trim() !== '')
      if (validItems.length === 0 && !finalDesc) {
        alert('Debes agregar al menos un producto a la lista de compra o escribir la descripción.')
        return
      }
      if (!finalDesc && validItems.length > 0) {
        finalDesc = validItems.map(i => `${i.quantity}x ${i.description}`).join(', ')
      }
      itemsToSave = validItems
    }

    if (!finalDesc) {
      if (activeTab === 'PAGO_EMPLEADOS') finalDesc = `Pago a ${responsible || 'Empleado'}`
      else if (activeTab === 'OTROS_GASTOS') finalDesc = 'Gasto menor de caja'
      else if (activeTab === 'FONDO_INICIAL') finalDesc = 'Apertura de caja / Fondo inicial'
    }

    setLoading(true)
    try {
      await createCashMovement({
        category: activeTab,
        description: finalDesc,
        amount: parsedAmount,
        responsible: responsible.trim() || undefined,
        notes: notes.trim() || undefined,
        date: selectedDate,
        items: itemsToSave
      })

      resetForm()
      router.refresh()
    } catch (err: any) {
      alert('Error al registrar movimiento: ' + (err?.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de caja?')) return
    setLoading(true)
    try {
      await deleteCashMovement(id)
      router.refresh()
    } catch (err: any) {
      alert('Error al eliminar: ' + err?.message)
    } finally {
      setLoading(false)
    }
  }

  const isNetPositive = initialData.netCashBalance >= 0

  return (
    <div className="space-y-6">
      {/* Encabezado y Selector de Fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Wallet className="h-7 w-7 text-emerald-600" />
            Control de Caja y Gastos Diarios
          </h1>
          <p className="text-sm text-muted-foreground">
            Lleva el control exacto del dinero de la venta en efectivo, compra de insumos, pago a empleados y gastos menores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="h-4 w-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-sm font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1 font-bold print:hidden"
          >
            <Printer className="h-4 w-4" />
            Imprimir Cuadre
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen Diario (Cuadre de Caja) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Ventas en Efectivo */}
        <Card className="border-emerald-200 bg-emerald-50/40 col-span-1">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Ventas Efectivo
              </span>
              <ArrowDownRight className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
              RD${initialData.totalCashSales.toFixed(2)}
            </div>
            <p className="text-[11px] text-emerald-700">
              {initialData.cashInvoicesCount} factura(s) cobradas hoy
            </p>
          </CardContent>
        </Card>

        {/* Compras de Productos */}
        <Card className="border-blue-200 bg-blue-50/40 col-span-1">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Compras Mercancía
              </span>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono">
              -RD${initialData.totalProductPurchases.toFixed(2)}
            </div>
            <p className="text-[11px] text-blue-700">
              Insumos y productos en efectivo
            </p>
          </CardContent>
        </Card>

        {/* Pago a Empleados */}
        <Card className="border-purple-200 bg-purple-50/40 col-span-1">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                Pago Empleados
              </span>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-900 font-mono">
              -RD${initialData.totalEmployeePayments.toFixed(2)}
            </div>
            <p className="text-[11px] text-purple-700">
              Sueldos, propinas o adelantos
            </p>
          </CardContent>
        </Card>

        {/* Otros Gastos */}
        <Card className="border-amber-200 bg-amber-50/40 col-span-1">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Otros Gastos
              </span>
              <Coffee className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
              -RD${initialData.totalOtherExpenses.toFixed(2)}
            </div>
            <p className="text-[11px] text-amber-700">
              Hielo, fundas, delivery, varios
            </p>
          </CardContent>
        </Card>

        {/* Balance Final en Caja */}
        <Card className={`col-span-2 lg:col-span-1 border-2 ${
          isNetPositive ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-rose-600 bg-rose-600 text-white'
        }`}>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider opacity-90">
                Efectivo en Caja
              </span>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono">
              RD${initialData.netCashBalance.toFixed(2)}
            </div>
            <p className="text-[11px] opacity-90 font-medium">
              {isNetPositive ? '✓ Caja cuadrada y positiva' : '⚠ Déficit en caja'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* BARRA DIRECTA PARA ESCRIBIR Y REGISTRAR LO QUE SE PAGA */}
      <QuickExpenseBar 
        title="Barra Rápida: Escribe lo que se pagó hoy y regístralo"
        subtitle="Escribe directamente el concepto (ej. Sueldo Juan, Hielo, Harina), el monto y haz clic en REGISTRAR."
      />

      {/* BARRA DE REGISTRO RÁPIDO DE SALIDAS / GASTOS EN EFECTIVO */}
      <Card className="shadow-md border-slate-300 print:hidden">
        <CardHeader className="bg-slate-50 border-b py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Registrar Salida de Dinero de la Venta
            </CardTitle>

            {/* Pestañas de categoría */}
            <div className="flex rounded-lg border bg-white p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('COMPRA_PRODUCTOS'); resetForm(); }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'COMPRA_PRODUCTOS' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛒 Compra de Productos
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('PAGO_EMPLEADOS'); resetForm(); }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'PAGO_EMPLEADOS' 
                    ? 'bg-purple-600 text-white shadow' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👷 Pago a Empleados
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('OTROS_GASTOS'); resetForm(); }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'OTROS_GASTOS' 
                    ? 'bg-amber-600 text-white shadow' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ Otros Gastos
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('FONDO_INICIAL'); resetForm(); }}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'FONDO_INICIAL' 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏦 Fondo de Apertura
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Caso 1: COMPRA DE PRODUCTOS EN EFECTIVO (LISTA DE PRODUCTOS) */}
            {activeTab === 'COMPRA_PRODUCTOS' && (
              <div className="space-y-3">
                {/* BARRA DE BÚSQUEDA RÁPIDA DE PRODUCTOS */}
                <div className="relative">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                      <Input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value)
                          setSearchOpen(true)
                        }}
                        onFocus={() => setSearchOpen(true)}
                        placeholder="🔍 Buscar producto en el catálogo por nombre (ej. Harina, Azúcar, Leche...)"
                        className="pl-9 pr-9 h-10 border-blue-300 focus-visible:ring-blue-500 bg-blue-50/30 text-sm font-medium"
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
                      onClick={addProductItem}
                      className="h-10 text-xs font-bold text-slate-700 hover:bg-slate-50 border-slate-300 shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1 text-emerald-600" />
                      + Añadir Ítem Libre
                    </Button>
                  </div>

                  {/* Resultados flotantes de búsqueda */}
                  {searchOpen && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-11 z-50 bg-white border-2 border-blue-300 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y animate-in fade-in zoom-in-95 duration-100">
                      <div className="p-2 bg-blue-50 text-[11px] font-bold text-blue-800 flex justify-between items-center">
                        <span>Resultados de búsqueda ({searchResults.length}):</span>
                        <span className="text-[10px] text-blue-600">Haz clic en un producto para agregarlo</span>
                      </div>
                      {searchResults.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleAddFromSearch(p)}
                          className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                            <div className="text-xs text-slate-500">Stock actual: {p.stock} unid.</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-blue-700 text-sm">RD${p.price.toFixed(2)}</span>
                            <span className="block text-[11px] text-emerald-600 font-bold">+ Agregar a la lista</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    Lista de Productos a Comprar con Dinero de Venta:
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Total productos en lista: {productItems.length}
                  </span>
                </div>

                <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[220px]">Elegir del Catálogo (Opcional)</TableHead>
                        <TableHead>Descripción / Producto Comprado</TableHead>
                        <TableHead className="w-[85px] text-right">Cant.</TableHead>
                        <TableHead className="w-[110px] text-right">Precio Unit.</TableHead>
                        <TableHead className="w-[110px] text-right">Total RD$</TableHead>
                        <TableHead className="w-[120px] text-center">¿Sumar a Stock?</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productItems.map((item, idx) => (
                        <TableRow key={idx}>
                          {/* Catálogo */}
                          <TableCell className="p-2">
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                              className="h-8 w-full text-xs rounded-md border border-input bg-background px-2 font-medium"
                            >
                              <option value="">(Libre / No en catálogo)</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                              ))}
                            </select>
                          </TableCell>

                          {/* Nombre / Descripción */}
                          <TableCell className="p-2">
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemDescChange(idx, e.target.value)}
                              placeholder="Ej. Saco de Harina, Azúcar, Leche..."
                              className="h-8 text-xs font-medium"
                              required
                            />
                          </TableCell>

                          {/* Cantidad */}
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.01"
                              value={item.quantity}
                              onChange={(e) => handleItemQtyChange(idx, parseFloat(e.target.value) || 1)}
                              className="h-8 text-xs text-right font-bold"
                            />
                          </TableCell>

                          {/* Precio */}
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs text-right font-bold"
                            />
                          </TableCell>

                          {/* Total fila */}
                          <TableCell className="p-2 text-right font-bold text-xs font-mono text-slate-900">
                            RD${item.total.toFixed(2)}
                          </TableCell>

                          {/* Sumar a inventario */}
                          <TableCell className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.addToStock}
                              disabled={!item.productId}
                              onChange={(e) => handleItemStockToggle(idx, e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title={item.productId ? 'Aumenta el inventario de este producto' : 'Selecciona un producto del catálogo para activar'}
                            />
                          </TableCell>

                          {/* Borrar fila */}
                          <TableCell className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={productItems.length === 1}
                              onClick={() => removeProductItem(idx)}
                              className="h-7 w-7 text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <Label className="text-xs">Comprado a / Proveedor:</Label>
                    <Input
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                      placeholder="Ej. Colmado El Sol, Supermercado..."
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Observaciones:</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej. Comprado para el pedido de pasteles..."
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Total Pagado en Efectivo (RD$):</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-9 text-sm font-bold font-mono text-right bg-blue-50/50 border-blue-300 text-blue-950"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Caso 2: PAGO A EMPLEADOS */}
            {activeTab === 'PAGO_EMPLEADOS' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-bold">Nombre del Empleado *</Label>
                  <Input
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    placeholder="Ej. Juan Pérez, María Gómez..."
                    className="h-9 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Concepto del Pago *</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Sueldo del día, adelanto, propina, horas extra..."
                    className="h-9 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Monto Pagado en Efectivo (RD$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-sm font-bold font-mono text-right bg-purple-50/50 border-purple-300 text-purple-950"
                    required
                  />
                </div>
              </div>
            )}

            {/* Caso 3: OTROS GASTOS */}
            {activeTab === 'OTROS_GASTOS' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-bold">Concepto del Gasto *</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Fundas plásticas, Hielo, Delivery, Gas..."
                    className="h-9 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Pagado a / Responsable:</Label>
                  <Input
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    placeholder="Ej. Repartidor, Estación de combustible..."
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Monto Pagado en Efectivo (RD$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-sm font-bold font-mono text-right bg-amber-50/50 border-amber-300 text-amber-950"
                    required
                  />
                </div>
              </div>
            )}

            {/* Caso 4: FONDO DE APERTURA / CAJA INICIAL */}
            {activeTab === 'FONDO_INICIAL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">Concepto / Detalle:</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Fondo inicial para cambio / Menudo"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Monto Inicial en Efectivo (RD$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-sm font-bold font-mono text-right bg-emerald-50/50 border-emerald-300 text-emerald-950"
                    required
                  />
                </div>
              </div>
            )}

            {/* Botón de Enviar */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow"
              >
                {loading ? 'Guardando...' : '✓ Registrar en Caja Diaria'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* TABLA DE HISTORIAL DE MOVIMIENTOS DEL DÍA */}
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800">
            Movimientos Registrados del Día ({selectedDate})
          </CardTitle>
          <span className="text-xs text-muted-foreground font-semibold">
            Total Movimientos: {initialData.movements.length}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {initialData.movements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No hay salidas ni movimientos registrados para esta fecha.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">Hora</TableHead>
                  <TableHead className="w-[160px]">Categoría</TableHead>
                  <TableHead>Concepto / Detalle de Productos</TableHead>
                  <TableHead className="w-[160px]">Responsable / Pagado a</TableHead>
                  <TableHead className="w-[130px] text-right">Monto</TableHead>
                  <TableHead className="w-[50px] print:hidden"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.movements.map((m: any) => {
                  const isOutflow = m.type === 'OUTFLOW'
                  const timeStr = new Date(m.createdAt).toLocaleTimeString('es-DO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })

                  let badgeColor = 'bg-slate-100 text-slate-800 border-slate-200'
                  let categoryLabel = m.category
                  if (m.category === 'COMPRA_PRODUCTOS') {
                    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300'
                    categoryLabel = '🛒 Compra Productos'
                  } else if (m.category === 'PAGO_EMPLEADOS') {
                    badgeColor = 'bg-purple-100 text-purple-800 border-purple-300'
                    categoryLabel = '👷 Pago Empleado'
                  } else if (m.category === 'OTROS_GASTOS') {
                    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300'
                    categoryLabel = '⚡ Otro Gasto'
                  } else if (m.category === 'FONDO_INICIAL') {
                    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    categoryLabel = '🏦 Fondo Inicial'
                  }

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {timeStr}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeColor}`}>
                          {categoryLabel}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 text-sm">
                          {m.description}
                        </div>
                        {m.items && m.items.length > 0 && (
                          <div className="mt-1 space-y-0.5 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="font-bold text-slate-700">Artículos:</span>
                            {m.items.map((it: any) => (
                              <div key={it.id} className="flex justify-between text-[11px]">
                                <span>• {it.quantity}x {it.description} @ RD${it.unitPrice.toFixed(2)}</span>
                                <span className="font-mono font-bold">RD${it.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {m.notes && (
                          <div className="text-xs text-slate-500 italic mt-0.5">
                            Nota: {m.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {m.responsible || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-bold font-mono text-sm ${
                        isOutflow ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {isOutflow ? `-RD$${m.amount.toFixed(2)}` : `+RD$${m.amount.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="print:hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(m.id)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
