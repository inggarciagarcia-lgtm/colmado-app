'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  UserPlus, 
  CreditCard, 
  DollarSign, 
  Bike, 
  PauseCircle, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle,
  Wine,
  Wheat,
  Utensils,
  Package,
  Layers,
  X,
  Store,
  ChevronRight,
  Receipt,
  BookOpen
} from 'lucide-react'
import { createPosSale, createFiaoSale } from '@/lib/actions/colmado-pos'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string | null
  unit: string
  isPopular: boolean
  returnable: boolean
  barcode: string | null
  hasItbis: boolean
}

interface Client {
  id: string
  name: string
  nickname: string | null
  phone: string | null
  address: string | null
  creditLimit: number
  creditBalance: number
  bottleDebt: string | null
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  unit: string
  hasItbis: boolean
  returnable: boolean
  total: number
}

interface PosClientProps {
  initialProducts: Product[]
  initialClients: Client[]
  company: {
    id: string
    name: string
    rnc?: string | null
    phone?: string | null
    address?: string | null
    slogan?: string | null
    ncfExpiry?: string | null
  }
}

export function PosClient({ initialProducts, initialClients, company }: PosClientProps) {
  // Tabs de Tickets simultáneos (Ticket 1, Ticket 2, Ticket 3)
  const [activeTicketIndex, setActiveTicketIndex] = useState(0)
  const [tickets, setTickets] = useState<{
    items: CartItem[]
    selectedClient: Client | null
  }[]>([
    { items: [], selectedClient: null },
    { items: [], selectedClient: null },
    { items: [], selectedClient: null }
  ])

  // Búsqueda y Filtro de Categoría
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS')

  // Efectivo con que paga el cliente
  const [cashGiven, setCashGiven] = useState<number | string>('')

  // Modales
  const [showFiaoModal, setShowFiaoModal] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [lastSaleResult, setLastSaleResult] = useState<any>(null)
  const [fiaoNeighborSearch, setFiaoNeighborSearch] = useState('')
  const [selectedFiaoClient, setSelectedFiaoClient] = useState<Client | null>(null)
  const [bottleDebtInput, setBottleDebtInput] = useState('')
  const [deliveryDriver, setDeliveryDriver] = useState('')
  const [deliveryChange, setDeliveryChange] = useState('')

  // Peso rápido o venta por dinero para productos seleccionados
  const [quickWeightProduct, setQuickWeightProduct] = useState<Product | null>(null)

  // Estado de carga
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Ticket actual
  const currentTicket = tickets[activeTicketIndex]
  const cartItems = currentTicket.items

  // Lista de categorías para botones superiores
  const categories = [
    { id: 'TODOS', label: 'Todos', icon: Layers },
    { id: 'POPULARES', label: 'Favoritos ⭐', icon: Sparkles },
    { id: 'BEBIDAS', label: 'Bebidas y Frías 🍺', icon: Wine },
    { id: 'VIVERES', label: 'Víveres y Granos 🍚', icon: Wheat },
    { id: 'EMBUTIDOS', label: 'Embutidos y Queso 🧀', icon: Utensils },
    { id: 'PANADERIA', label: 'Panadería 🥖', icon: Package },
    { id: 'VARIOS', label: 'Limpieza y Varios 🧼', icon: Package }
  ]

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery))
      if (!matchSearch) return false

      if (selectedCategory === 'TODOS') return true
      if (selectedCategory === 'POPULARES') return p.isPopular
      return p.category === selectedCategory
    })
  }, [initialProducts, searchQuery, selectedCategory])

  // Cálculos de Totales
  const subtotal = cartItems.reduce((acc, i) => acc + i.total, 0)
  const taxableSubtotal = cartItems.filter(i => i.hasItbis).reduce((acc, i) => acc + i.total, 0)
  const itbis = taxableSubtotal * 0.18
  const total = subtotal + itbis

  const cashGivenNumber = typeof cashGiven === 'number' ? cashGiven : parseFloat(cashGiven) || 0
  const devuelta = Math.max(0, cashGivenNumber - total)
  const falta = Math.max(0, total - cashGivenNumber)

  // Agregar producto al ticket
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    setTickets(prev => {
      const copy = [...prev]
      const current = { ...copy[activeTicketIndex] }
      const items = [...current.items]
      const existingIndex = items.findIndex(i => i.productId === product.id)

      if (existingIndex >= 0) {
        const item = items[existingIndex]
        const newQty = Number((item.quantity + quantityToAdd).toFixed(2))
        items[existingIndex] = {
          ...item,
          quantity: newQty,
          total: Number((newQty * item.price).toFixed(2))
        }
      } else {
        items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: quantityToAdd,
          unit: product.unit,
          hasItbis: product.hasItbis,
          returnable: product.returnable,
          total: Number((quantityToAdd * product.price).toFixed(2))
        })
      }
      current.items = items
      copy[activeTicketIndex] = current
      return copy
    })

    // Feedback visual ligero
    setStatusMessage({ type: 'success', text: `+ ${product.name}` })
    setTimeout(() => setStatusMessage(null), 1500)
  }

  // Modificar cantidad
  const updateQuantity = (index: number, newQty: number) => {
    setTickets(prev => {
      const copy = [...prev]
      const current = { ...copy[activeTicketIndex] }
      const items = [...current.items]

      if (newQty <= 0) {
        items.splice(index, 1)
      } else {
        const item = items[index]
        const qty = Number(newQty.toFixed(2))
        items[index] = {
          ...item,
          quantity: qty,
          total: Number((qty * item.price).toFixed(2))
        }
      }
      current.items = items
      copy[activeTicketIndex] = current
      return copy
    })
  }

  // Limpiar ticket actual
  const clearCurrentTicket = () => {
    setTickets(prev => {
      const copy = [...prev]
      copy[activeTicketIndex] = { items: [], selectedClient: null }
      return copy
    })
    setCashGiven('')
  }

  // Billete rápido dominicano
  const handleQuickCash = (amount: number) => {
    setCashGiven(amount)
  }

  // Cobrar en Efectivo
  const handleCheckoutCash = async () => {
    if (cartItems.length === 0) return
    if (cashGivenNumber < total) {
      alert(`El monto recibido (RD$ ${cashGivenNumber.toFixed(2)}) es menor que el total de la compra (RD$ ${total.toFixed(2)}).`)
      return
    }

    try {
      setIsProcessing(true)
      const res = await createPosSale({
        items: cartItems.map(i => ({
          productId: i.productId,
          description: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          hasItbis: i.hasItbis,
          total: i.total
        })),
        amountPaid: cashGivenNumber,
        changeReturn: devuelta,
        paymentMethod: 'EFECTIVO'
      })

      if (res.success) {
        setLastSaleResult({
          invoice: res.invoice,
          cashGiven: cashGivenNumber,
          devuelta: devuelta,
          type: 'EFECTIVO'
        })
        clearCurrentTicket()
        setShowReceiptModal(true)
      }
    } catch (err: any) {
      alert(`Error al registrar venta: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Confirmar Venta a Fiao
  const handleConfirmFiao = async () => {
    if (!selectedFiaoClient) {
      alert('Por favor selecciona el vecino o cliente a quien se le fiará.')
      return
    }
    if (cartItems.length === 0) return

    try {
      setIsProcessing(true)
      const res = await createFiaoSale({
        clientId: selectedFiaoClient.id,
        items: cartItems.map(i => ({
          productId: i.productId,
          description: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          hasItbis: i.hasItbis,
          total: i.total
        })),
        newBottleDebt: bottleDebtInput || undefined
      })

      if (res.success) {
        setLastSaleResult({
          invoice: res.invoice,
          client: res.updatedClient,
          type: 'FIAO'
        })
        clearCurrentTicket()
        setShowFiaoModal(false)
        setShowReceiptModal(true)
      }
    } catch (err: any) {
      alert(`Error al procesar fiao: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Despachar Delivery
  const handleConfirmDelivery = async () => {
    if (!deliveryDriver) {
      alert('Ingresa el nombre o apodo del motorista de delivery.')
      return
    }

    try {
      setIsProcessing(true)
      const changeVal = parseFloat(deliveryChange) || 0
      const res = await createPosSale({
        items: cartItems.map(i => ({
          productId: i.productId,
          description: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          hasItbis: i.hasItbis,
          total: i.total
        })),
        amountPaid: total + changeVal,
        changeReturn: changeVal,
        paymentMethod: 'DELIVERY',
        notes: `Delivery con ${deliveryDriver}. Menudo despachado: RD$ ${changeVal}`
      })

      if (res.success) {
        setLastSaleResult({
          invoice: res.invoice,
          type: 'DELIVERY',
          driver: deliveryDriver,
          deliveryChange: changeVal
        })
        clearCurrentTicket()
        setShowDeliveryModal(false)
        setShowReceiptModal(true)
      }
    } catch (err: any) {
      alert(`Error al enviar delivery: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Vecinos filtrados en el modal de fiao
  const filteredNeighbors = useMemo(() => {
    return initialClients.filter(c => 
      c.name.toLowerCase().includes(fiaoNeighborSearch.toLowerCase()) ||
      (c.nickname && c.nickname.toLowerCase().includes(fiaoNeighborSearch.toLowerCase())) ||
      (c.phone && c.phone.includes(fiaoNeighborSearch))
    )
  }, [initialClients, fiaoNeighborSearch])

  // Manejo de atajos de teclado (Enter para cobrar, Escape para cerrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setShowReceiptModal(false)
        setShowFiaoModal(false)
        setShowDeliveryModal(false)
        setQuickWeightProduct(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-slate-100">
      {/* 1. BARRA SUPERIOR DEL MOSTRADOR COLMADO */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white p-2 rounded-xl flex items-center justify-center shadow-xs">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {company.name}
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                POS Mostrador Rápido
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Caja activa • Cobro express en efectivo, fiao y delivery
            </p>
          </div>
        </div>

        {/* Pestañas de Tickets Múltiples (Ticket 1, Ticket 2, Ticket 3) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[0, 1, 2].map(idx => {
            const itemCount = tickets[idx].items.reduce((sum, i) => sum + i.quantity, 0)
            const isActive = activeTicketIndex === idx
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTicketIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Ticket #{idx + 1}</span>
                {itemCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                    {itemCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Botones de navegación directa a Fiao y Caja */}
        <div className="flex items-center gap-2">
          <Link
            href="/fiao"
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <BookOpen className="h-4 w-4 text-amber-600" />
            <span>Libreta de Fiao</span>
          </Link>
          <Link
            href="/caja-diaria"
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>Caja Diaria</span>
          </Link>
        </div>
      </div>

      {/* 2. CUERPO PRINCIPAL: PRODUCTOS (IZQUIERDA) + TICKET Y COBRO (DERECHA) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL IZQUIERDO: CATÁLOGO TÁCTIL Y BUSCADOR */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
          
          {/* Barra de búsqueda y categorías */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o escanear código de barra... (Presiona F2)"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Badges de Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs font-bold scale-[1.02]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notificación flotante de producto añadido */}
          {statusMessage && (
            <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md animate-in fade-in slide-in-from-top-2 flex items-center justify-between">
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Cuadrícula de Productos Táctiles */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map(product => {
                const inCart = cartItems.find(i => i.productId === product.id)
                const isWeighed = product.unit === 'LIBRA'

                return (
                  <div
                    key={product.id}
                    className="group relative bg-white rounded-2xl border border-slate-200 p-3 flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all text-left select-none"
                  >
                    {/* Badge de cantidad en carrito si ya está */}
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                        {inCart.quantity}
                      </span>
                    )}

                    {/* Envase retornable pill */}
                    {product.returnable && (
                      <span className="self-start bg-amber-100 text-amber-900 font-bold text-[9px] px-1.5 py-0.5 rounded-md mb-1 flex items-center gap-1">
                        🍺 Retornable
                      </span>
                    )}

                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                        {product.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {product.unit} {product.stock > 0 ? `• Stock: ${product.stock}` : ''}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Precio</div>
                        <div className="font-black text-slate-900 text-sm sm:text-base leading-none">
                          RD$ {product.price.toFixed(2)}
                        </div>
                      </div>

                      {/* Botón principal de agregar */}
                      {isWeighed ? (
                        <button
                          type="button"
                          onClick={() => setQuickWeightProduct(product)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          title="Vender por libra o dinero"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Pesar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(product, 1)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-slate-600">No se encontraron productos</p>
                  <p className="text-xs">Prueba con otro término de búsqueda o categoría</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: TICKET DE COBRO RÁPIDO Y MENUDO */}
        <div className="w-[380px] lg:w-[420px] bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0 shadow-lg">
          
          {/* Header del Ticket */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Ticket #{activeTicketIndex + 1}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'} agregados
                </p>
              </div>
            </div>

            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCurrentTicket}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="Vaciar ticket actual"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Vaciar</span>
              </button>
            )}
          </div>

          {/* Lista de Artículos en el Ticket */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <ShoppingCart className="h-12 w-12 stroke-[1.5] text-slate-300 mb-2" />
                <p className="font-bold text-slate-600 text-sm">Ticket vacío</p>
                <p className="text-xs text-slate-400 max-w-[200px] mt-1">
                  Toca cualquier producto de la izquierda o búscalo con F2 para agregarlo al instante.
                </p>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      RD$ {item.price.toFixed(2)} x {item.quantity} {item.unit}
                    </div>
                  </div>

                  {/* Controles de Cantidad + / - */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-black text-slate-900 px-1 min-w-[20px] text-center text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Total de la línea */}
                  <div className="font-black text-slate-900 text-right min-w-[65px]">
                    RD$ {item.total.toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => updateQuantity(index, 0)}
                    className="text-slate-300 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 3. RESUMEN DE TOTALES Y BOTONERA DOMINICANA */}
          <div className="border-t border-slate-200 bg-slate-50/50 p-3 space-y-3 shrink-0">
            
            {/* Totales */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">RD$ {subtotal.toFixed(2)}</span>
              </div>
              {itbis > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>ITBIS (18% en bebidas/cigarrillos)</span>
                  <span>RD$ {itbis.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
                <span className="text-sm font-black text-slate-900">TOTAL A PAGAR</span>
                <span className="text-xl font-black text-emerald-700">
                  RD$ {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* BOTONERA DE BILLETES DOMINICANOS */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span>PAGO CON BILLETES RD$:</span>
                {cashGivenNumber > 0 && (
                  <button
                    type="button"
                    onClick={() => setCashGiven('')}
                    className="text-rose-600 hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCash(total)}
                  className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold rounded-lg text-xs border border-emerald-300 transition-colors cursor-pointer"
                >
                  Exacto
                </button>
                {[100, 200, 500, 1000, 2000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    RD$ {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Input manual de pago si es otro monto */}
              <div className="relative pt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Pagó con RD$
                </span>
                <input
                  type="number"
                  step="any"
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-right pl-24 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* CAJA DE DEVUELTA GIGANTE */}
            {total > 0 && cashGivenNumber > 0 && (
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                cashGivenNumber >= total
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {cashGivenNumber >= total ? (
                  <>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                        DEVUELTA AL CLIENTE
                      </div>
                      <div className="text-xl font-black leading-tight">
                        RD$ {devuelta.toFixed(2)}
                      </div>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-emerald-200" />
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        FALTA POR PAGAR
                      </div>
                      <div className="text-lg font-black leading-tight text-rose-600">
                        RD$ {falta.toFixed(2)}
                      </div>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </>
                )}
              </div>
            )}

            {/* BOTONES PRINCIPALES DE ACCIÓN */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Botón Cobrar en Efectivo */}
              <button
                type="button"
                disabled={cartItems.length === 0 || isProcessing || (cashGivenNumber > 0 && cashGivenNumber < total)}
                onClick={handleCheckoutCash}
                className="col-span-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none text-white font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <DollarSign className="h-5 w-5" />
                <span>COBRAR EN EFECTIVO (RD$ {total.toFixed(2)})</span>
              </button>

              {/* Botón Fiar a Vecino */}
              <button
                type="button"
                disabled={cartItems.length === 0 || isProcessing}
                onClick={() => {
                  setSelectedFiaoClient(null)
                  setShowFiaoModal(true)
                }}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="h-4 w-4" />
                <span>FIAR A VECINO</span>
              </button>

              {/* Botón Delivery */}
              <button
                type="button"
                disabled={cartItems.length === 0 || isProcessing}
                onClick={() => setShowDeliveryModal(true)}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bike className="h-4 w-4" />
                <span>DELIVERY</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: PESO RÁPIDO / VENTA POR DINERO (LIBRAS O RD$) */}
      {quickWeightProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{quickWeightProduct.name}</h3>
                <p className="text-xs text-slate-500">
                  Precio: RD$ {quickWeightProduct.price.toFixed(2)} por {quickWeightProduct.unit}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setQuickWeightProduct(null)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Opciones por Libras */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Seleccionar por Peso (Libras):</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '1/4 lb', qty: 0.25 },
                  { label: '1/2 lb', qty: 0.5 },
                  { label: '1 lb', qty: 1.0 },
                  { label: '2 lbs', qty: 2.0 },
                  { label: '3 lbs', qty: 3.0 },
                  { label: '5 lbs', qty: 5.0 }
                ].map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      addToCart(quickWeightProduct, opt.qty)
                      setQuickWeightProduct(null)
                    }}
                    className="py-2 px-2 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold text-slate-800 transition-colors border border-slate-200"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opciones por Monto en Dinero RD$ ("Dame RD$50 de queso") */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">O Vender por Dinero (RD$):</label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100, 150, 200].map(moneyAmount => {
                  const calculatedQty = Number((moneyAmount / quickWeightProduct.price).toFixed(2))
                  return (
                    <button
                      key={moneyAmount}
                      type="button"
                      onClick={() => {
                        addToCart(quickWeightProduct, calculatedQty)
                        setQuickWeightProduct(null)
                      }}
                      className="py-2 px-2 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-900 rounded-xl text-xs font-bold transition-colors border border-amber-200 flex flex-col items-center"
                    >
                      <span>RD$ {moneyAmount}</span>
                      <span className="text-[10px] font-medium opacity-80">{calculatedQty} lb</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  addToCart(quickWeightProduct, 1)
                  setQuickWeightProduct(null)
                }}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
              >
                Agregar 1 Unidad Completa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FIAR A VECINO / LIBRETA DE CRÉDITO */}
      {showFiaoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Fiar a Vecino o Cliente</h3>
                  <p className="text-xs text-slate-500">Monto total a cargar: RD$ {total.toFixed(2)}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowFiaoModal(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Buscador de Vecino */}
            <div className="shrink-0">
              <input
                type="text"
                value={fiaoNeighborSearch}
                onChange={e => setFiaoNeighborSearch(e.target.value)}
                placeholder="Buscar por apodo, nombre o teléfono (ej. 'Doña Carmen', 'El Moreno')..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Lista de Vecinos con su deuda actual y límite */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredNeighbors.map(neighbor => {
                const isSelected = selectedFiaoClient?.id === neighbor.id
                const debtPercent = Math.min(100, Math.round((neighbor.creditBalance / neighbor.creditLimit) * 100))

                return (
                  <div
                    key={neighbor.id}
                    onClick={() => setSelectedFiaoClient(neighbor)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {neighbor.nickname || neighbor.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {neighbor.name !== neighbor.nickname ? neighbor.name : ''} {neighbor.phone ? `• Tel: ${neighbor.phone}` : ''}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Debe actualmente</div>
                        <div className="font-black text-rose-600 text-sm">
                          RD$ {neighbor.creditBalance.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Barra de límite de crédito */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Límite: RD$ {neighbor.creditLimit.toLocaleString()}</span>
                      {neighbor.bottleDebt && (
                        <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                          🍺 {neighbor.bottleDebt}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Campo adicional: Deuda de botellas/vacíos */}
            {selectedFiaoClient && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shrink-0 space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>¿Se llevó botellas o botellón vacío sin dejar el suyo?</span>
                </div>
                <input
                  type="text"
                  value={bottleDebtInput}
                  onChange={e => setBottleDebtInput(e.target.value)}
                  placeholder="Ej. Debe 2 Grandes de Presidente, o 1 Botellón vacío"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>
            )}

            {/* Botón Confirmar Fiao */}
            <div className="shrink-0 pt-2 border-t border-slate-200">
              <button
                type="button"
                disabled={!selectedFiaoClient || isProcessing}
                onClick={handleConfirmFiao}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                {isProcessing 
                  ? 'Guardando en la libreta...' 
                  : `CONFIRMAR FIAO A ${selectedFiaoClient ? (selectedFiaoClient.nickname || selectedFiaoClient.name).toUpperCase() : '...'}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELIVERY / MOTORISTA */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Bike className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Despachar Pedido por Delivery</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowDeliveryModal(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Nombre o Motorista de Delivery:</label>
                <input
                  type="text"
                  value={deliveryDriver}
                  onChange={e => setDeliveryDriver(e.target.value)}
                  placeholder="Ej. Carlos, El Chino, Delivery 1"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Menudo / Cambio que lleva para el cliente (RD$):</label>
                <input
                  type="number"
                  value={deliveryChange}
                  onChange={e => setDeliveryChange(e.target.value)}
                  placeholder="Ej. 500 (si el cliente paga con 1000)"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                <div className="font-bold">Total del Pedido: RD$ {total.toFixed(2)}</div>
                <p className="text-[11px] text-blue-700">
                  El motorista debe regresar con el dinero exacto cobrado o el recibo firmado.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                disabled={!deliveryDriver || isProcessing}
                onClick={handleConfirmDelivery}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                DESPACHAR DELIVERY AHORA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TICKET TÉRMICO / VENTA EXITOSA */}
      {showReceiptModal && lastSaleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>¡VENTA REGISTRADA CON ÉXITO!</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* VISTA PREVIA DEL TICKET (Formato térmico 58mm / 80mm) */}
            <div 
              id="colmado-thermal-receipt" 
              className="bg-slate-50 border border-slate-300 rounded-lg p-4 font-mono text-xs text-slate-800 space-y-2 shadow-inner"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <div className="font-black text-sm uppercase">{company.name}</div>
                {company.rnc && <div>RNC: {company.rnc}</div>}
                {company.address && <div className="text-[10px]">{company.address}</div>}
                {company.phone && <div>Tel: {company.phone}</div>}
                <div className="font-bold text-[10px] mt-1 italic text-slate-600">{company.slogan || '¡Gracias por su compra!'}</div>
              </div>

              <div className="py-1 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
                <div>Factura: {lastSaleResult.invoice.number}</div>
                <div>NCF: {lastSaleResult.invoice.ncf || 'B0200000000'}</div>
                <div>Tipo: {lastSaleResult.type}</div>
                {lastSaleResult.client && (
                  <div>Cliente: {lastSaleResult.client.nickname || lastSaleResult.client.name}</div>
                )}
                <div>Fecha: {new Date(lastSaleResult.invoice.createdAt).toLocaleString('es-DO')}</div>
              </div>

              {/* Items */}
              <div className="py-1 border-b border-dashed border-slate-400 space-y-1">
                {lastSaleResult.invoice.items?.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[170px]">{it.quantity}x {it.description}</span>
                    <span className="font-bold">RD$ {it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="pt-1 space-y-0.5 text-right font-bold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>RD$ {lastSaleResult.invoice.subtotal.toFixed(2)}</span>
                </div>
                {lastSaleResult.invoice.itbis > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span>ITBIS (18%):</span>
                    <span>RD$ {lastSaleResult.invoice.itbis.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black border-t border-slate-400 pt-1">
                  <span>TOTAL:</span>
                  <span>RD$ {lastSaleResult.invoice.total.toFixed(2)}</span>
                </div>

                {lastSaleResult.type === 'EFECTIVO' && (
                  <>
                    <div className="flex justify-between text-[11px] font-normal pt-1">
                      <span>Pagó con:</span>
                      <span>RD$ {lastSaleResult.cashGiven.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-emerald-800">
                      <span>Devuelta:</span>
                      <span>RD$ {lastSaleResult.devuelta.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {lastSaleResult.type === 'FIAO' && (
                  <div className="text-center pt-2 text-rose-700 font-black text-xs">
                    *** CUENTA PENDIENTE (FIAO) ***
                    <div className="text-[11px] font-normal text-slate-700">
                      Balance actual: RD$ {lastSaleResult.client.creditBalance.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-500 border-t border-dashed border-slate-400">
                ¡Que Dios bendiga su hogar!
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Ticket Térmico</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-colors cursor-pointer"
              >
                LISTO PARA SIGUIENTE CLIENTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
