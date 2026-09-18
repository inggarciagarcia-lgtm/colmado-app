'use client'

import { useState, useMemo } from 'react'
import { 
  BookOpen, 
  Search, 
  DollarSign, 
  Users, 
  Wine, 
  MessageCircle, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle,
  Edit2,
  X,
  Store,
  ArrowUpRight,
  TrendingDown,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Zap,
  ListPlus,
  Receipt,
  Eye,
  History,
  Check
} from 'lucide-react'
import { 
  registerFiaoClient, 
  createDirectAmountFiao, 
  createDetailedFiao, 
  getClientFiaoHistory 
} from '@/lib/actions/fiao-app'
import { recordClientAbono, updateClientCreditInfo } from '@/lib/actions/colmado-pos'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  unit: string
  category: string | null
  stock: number
}

interface ClientWithRelations {
  id: string
  name: string
  nickname: string | null
  phone: string | null
  address: string | null
  creditLimit: number
  creditBalance: number
  bottleDebt: string | null
  invoices?: any[]
  transactions?: any[]
  updatedAt?: any
}

interface FiaoClientProps {
  initialClients: ClientWithRelations[]
  products: Product[]
  totalStreetMoney: number
  totalDebtors: number
  totalBottleDebtors: number
  company: {
    id: string
    name: string
    phone?: string | null
  }
}

export function FiaoClient({
  initialClients,
  products,
  totalStreetMoney: initialStreetMoney,
  totalDebtors: initialTotalDebtors,
  totalBottleDebtors: initialBottleDebtors,
  company
}: FiaoClientProps) {
  const [clients, setClients] = useState<ClientWithRelations[]>(initialClients)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'CON_DEUDA' | 'LIMITE_ALTO' | 'BOTELLAS'>('CON_DEUDA')

  // --- MODAL: ANOTAR FIAO ---
  const [showAnotarModal, setShowAnotarModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [fiaoMode, setFiaoMode] = useState<'DIRECTO' | 'DETALLADO'>('DIRECTO')
  
  // Fiao Directo (Solo Total en RD$)
  const [directAmount, setDirectAmount] = useState<string>('')
  const [directConcept, setDirectConcept] = useState<string>('')
  const [directBottleDebt, setDirectBottleDebt] = useState<string>('')

  // Fiao Detallado (Artículos)
  const [detailedItems, setDetailedItems] = useState<{
    productId?: string
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]>([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [customItemName, setCustomItemName] = useState('')
  const [customItemPrice, setCustomItemPrice] = useState('')
  const [customItemQty, setCustomItemQty] = useState('1')
  const [detailedConcept, setDetailedConcept] = useState('')
  const [detailedBottleDebt, setDetailedBottleDebt] = useState('')

  // --- MODAL: NUEVO CLIENTE ---
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newNickname, setNewNickname] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newCreditLimit, setNewCreditLimit] = useState('3000')
  const [newInitialDebt, setNewInitialDebt] = useState('')
  const [newBottleDebt, setNewBottleDebt] = useState('')

  // --- MODAL: ABONO ---
  const [abonoModalClient, setAbonoModalClient] = useState<ClientWithRelations | null>(null)
  const [abonoAmount, setAbonoAmount] = useState('')
  const [bottleReturned, setBottleReturned] = useState('')
  const [abonoNotes, setAbonoNotes] = useState('')

  // --- MODAL: HISTORIAL / EXPEDIENTE ---
  const [historyModalClient, setHistoryModalClient] = useState<ClientWithRelations | null>(null)
  const [clientHistoryData, setClientHistoryData] = useState<{
    invoices: any[]
    payments: any[]
  } | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // --- MODAL: EDITAR CLIENTE ---
  const [editModalClient, setEditModalClient] = useState<ClientWithRelations | null>(null)
  const [editNickname, setEditNickname] = useState('')
  const [editLimit, setEditLimit] = useState('')
  const [editBottleDebt, setEditBottleDebt] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')

  // Estado general
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Métricas dinámicas calculadas en el cliente
  const currentTotalStreetMoney = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.creditBalance || 0), 0)
  }, [clients])

  const currentTotalDebtors = useMemo(() => {
    return clients.filter(c => (c.creditBalance || 0) > 0).length
  }, [clients])

  const currentBottleDebtors = useMemo(() => {
    return clients.filter(c => c.bottleDebt && c.bottleDebt !== 'Al día').length
  }, [clients])

  // Filtrado de clientes
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nickname && c.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(searchQuery))
      if (!matchSearch) return false

      if (activeFilter === 'CON_DEUDA') return (c.creditBalance || 0) > 0
      if (activeFilter === 'LIMITE_ALTO') return c.creditLimit > 0 && ((c.creditBalance || 0) / c.creditLimit) >= 0.8
      if (activeFilter === 'BOTELLAS') return c.bottleDebt && c.bottleDebt !== 'Al día'
      return true
    })
  }, [clients, searchQuery, activeFilter])

  // Cliente seleccionado en el modal de anotar
  const selectedClient = clients.find(c => c.id === selectedClientId)

  // Totales de items detallados
  const detailedTotal = useMemo(() => {
    return detailedItems.reduce((sum, i) => sum + i.total, 0)
  }, [detailedItems])

  // Productos filtrados para agregar a fiao detallado
  const filteredProducts = useMemo(() => {
    if (!itemSearchQuery) return products.slice(0, 8)
    return products.filter(p => p.name.toLowerCase().includes(itemSearchQuery.toLowerCase())).slice(0, 10)
  }, [products, itemSearchQuery])

  // 1. REGISTRAR NUEVO CLIENTE
  const handleCreateClient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newName.trim()) {
      alert('Por favor escribe el nombre del cliente o vecino.')
      return
    }

    try {
      setIsProcessing(true)
      const created = await registerFiaoClient({
        name: newName,
        nickname: newNickname,
        phone: newPhone,
        address: newAddress,
        creditLimit: parseFloat(newCreditLimit) || 3000,
        initialDebt: parseFloat(newInitialDebt) || 0,
        bottleDebt: newBottleDebt
      })

      setClients(prev => [created, ...prev])
      setSuccessMessage(`¡Vecino ${created.nickname || created.name} registrado con éxito!`)
      setShowNewClientModal(false)
      
      // Limpiar formulario
      setNewName('')
      setNewNickname('')
      setNewPhone('')
      setNewAddress('')
      setNewCreditLimit('3000')
      setNewInitialDebt('')
      setNewBottleDebt('')

      // Si el modal de anotar fiao estaba abierto, seleccionarlo directamente
      if (showAnotarModal) {
        setSelectedClientId(created.id)
      }

      setTimeout(() => setSuccessMessage(null), 3500)
    } catch (err: any) {
      alert(`Error al registrar cliente: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 2. ANOTAR FIAO - MODO DIRECTO (SOLO DIGITAR TOTAL)
  const handleSaveDirectFiao = async () => {
    if (!selectedClientId) {
      alert('Por favor selecciona el vecino a quien se le anotará el fiao.')
      return
    }
    const amt = parseFloat(directAmount)
    if (isNaN(amt) || amt <= 0) {
      alert('Por favor digita un monto válido en RD$.')
      return
    }

    try {
      setIsProcessing(true)
      const res = await createDirectAmountFiao({
        clientId: selectedClientId,
        amount: amt,
        note: directConcept,
        bottleDebt: directBottleDebt || undefined
      })

      if (res.success) {
        setClients(prev => prev.map(c => c.id === selectedClientId ? { ...c, ...res.updatedClient } : c))
        setSuccessMessage(`✓ Anotado RD$ ${amt.toFixed(2)} a ${res.updatedClient.nickname || res.updatedClient.name}`)
        setShowAnotarModal(false)
        setDirectAmount('')
        setDirectConcept('')
        setDirectBottleDebt('')
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 3. ANOTAR FIAO - MODO DETALLADO (ARTÍCULOS)
  const addProductToDetailed = (prod: Product) => {
    setDetailedItems(prev => {
      const idx = prev.findIndex(i => i.productId === prod.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx].quantity += 1
        copy[idx].total = Number((copy[idx].quantity * copy[idx].unitPrice).toFixed(2))
        return copy
      } else {
        return [...prev, {
          productId: prod.id,
          description: prod.name,
          quantity: 1,
          unitPrice: prod.price,
          total: prod.price
        }]
      }
    })
  }

  const addCustomItemToDetailed = () => {
    if (!customItemName.trim()) return
    const price = parseFloat(customItemPrice) || 0
    const qty = parseFloat(customItemQty) || 1
    if (price <= 0) {
      alert('Ingresa un precio válido para el artículo.')
      return
    }

    setDetailedItems(prev => [
      ...prev,
      {
        description: customItemName.trim(),
        quantity: qty,
        unitPrice: price,
        total: Number((qty * price).toFixed(2))
      }
    ])

    setCustomItemName('')
    setCustomItemPrice('')
    setCustomItemQty('1')
  }

  const updateDetailedItemQty = (idx: number, newQty: number) => {
    if (newQty <= 0) {
      setDetailedItems(prev => prev.filter((_, i) => i !== idx))
    } else {
      setDetailedItems(prev => {
        const copy = [...prev]
        copy[idx].quantity = newQty
        copy[idx].total = Number((newQty * copy[idx].unitPrice).toFixed(2))
        return copy
      })
    }
  }

  const handleSaveDetailedFiao = async () => {
    if (!selectedClientId) {
      alert('Por favor selecciona el vecino a quien se le anotará el fiao.')
      return
    }
    if (detailedItems.length === 0) {
      alert('Por favor agrega al menos un artículo o producto a la lista.')
      return
    }

    try {
      setIsProcessing(true)
      const res = await createDetailedFiao({
        clientId: selectedClientId,
        items: detailedItems,
        note: detailedConcept,
        bottleDebt: detailedBottleDebt || undefined
      })

      if (res.success) {
        setClients(prev => prev.map(c => c.id === selectedClientId ? { ...c, ...res.updatedClient } : c))
        setSuccessMessage(`✓ Anotado fiao detallado de RD$ ${detailedTotal.toFixed(2)} a ${res.updatedClient.nickname || res.updatedClient.name}`)
        setShowAnotarModal(false)
        setDetailedItems([])
        setDetailedConcept('')
        setDetailedBottleDebt('')
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 4. REGISTRAR ABONO / PAGO
  const handleRecordAbono = async () => {
    if (!abonoModalClient) return
    const amt = parseFloat(abonoAmount)
    if (isNaN(amt) || amt <= 0) {
      alert('Ingresa un monto válido para el abono.')
      return
    }

    try {
      setIsProcessing(true)
      const res = await recordClientAbono({
        clientId: abonoModalClient.id,
        amount: amt,
        paymentMethod: 'EFECTIVO',
        bottleReturned: bottleReturned || undefined,
        notes: abonoNotes || undefined
      })

      if (res.success) {
        setClients(prev => prev.map(c => c.id === abonoModalClient.id ? { ...c, ...res.updatedClient } : c))
        setSuccessMessage(`✓ Abono de RD$ ${amt.toFixed(2)} registrado con éxito para ${abonoModalClient.nickname || abonoModalClient.name}`)
        setAbonoModalClient(null)
        setAbonoAmount('')
        setBottleReturned('')
        setAbonoNotes('')
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 5. ABRIR HISTORIAL / LIBRETA DEL VECINO
  const openClientHistory = async (client: ClientWithRelations) => {
    setHistoryModalClient(client)
    setIsLoadingHistory(true)
    try {
      const data = await getClientFiaoHistory(client.id)
      setClientHistoryData({
        invoices: data.invoices,
        payments: data.payments
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // 6. ENVIAR RECORDATORIO CORDIAL POR WHATSAPP
  const openWhatsAppReminder = (client: ClientWithRelations) => {
    if (!client.phone) {
      alert('Este cliente no tiene teléfono registrado. Puedes editarlo para agregar su celular.')
      return
    }

    let cleanPhone = client.phone.replace(/\D/g, '')
    if (cleanPhone.length === 10) cleanPhone = `1${cleanPhone}`

    const message = `Hola ${client.nickname || client.name}, un cordial saludo de ${company.name}. 🛒 Le informamos que su balance de fiao pendiente al día de hoy es de RD$ ${client.creditBalance.toFixed(2)}.${client.bottleDebt ? ` (Envases pendientes: ${client.bottleDebt}).` : ''} ¡Muchas gracias por su preferencia!`

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  // 7. GUARDAR EDICIÓN DE VECINO
  const handleSaveEdit = async () => {
    if (!editModalClient) return

    try {
      setIsProcessing(true)
      const res = await updateClientCreditInfo({
        clientId: editModalClient.id,
        nickname: editNickname,
        creditLimit: parseFloat(editLimit) || 3000,
        bottleDebt: editBottleDebt,
        phone: editPhone,
        address: editAddress
      })

      setClients(prev => prev.map(c => c.id === editModalClient.id ? { ...c, ...res } : c))
      setSuccessMessage('Información actualizada con éxito.')
      setEditModalClient(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      alert(`Error al actualizar: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-5 pb-16">
      {/* 1. HEADER PRINCIPAL DE LA APP DE FIAO */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Libreta Digital de Fiao
              </h1>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                App de Créditos
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de fiados directos, cuentas detalladas, abonos en efectivo y cobro por WhatsApp
            </p>
          </div>
        </div>

        {/* BOTONES PRINCIPALES DE ACCIÓN */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Botón 1: + Anotar Fiao (La estrella de la app) */}
          <button
            type="button"
            onClick={() => {
              if (clients.length > 0 && !selectedClientId) {
                setSelectedClientId(clients[0].id)
              }
              setShowAnotarModal(true)
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Zap className="h-4 w-4" />
            <span>+ ANOTAR FIAO</span>
          </button>

          {/* Botón 2: + Nuevo Vecino */}
          <button
            type="button"
            onClick={() => setShowNewClientModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            <Users className="h-4 w-4" />
            <span>+ Nuevo Cliente</span>
          </button>

          {/* Botón 3: Mostrador POS */}
          <Link
            href="/pos"
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2.5 rounded-xl text-xs transition-colors"
          >
            <Store className="h-4 w-4 text-emerald-600" />
            <span className="hidden md:inline">Mostrador POS</span>
          </Link>
        </div>
      </div>

      {/* Alerta flotante de éxito */}
      {successMessage && (
        <div className="bg-emerald-600 text-white font-black text-xs p-3.5 rounded-xl shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. TARJETAS DE MÉTRICAS CLAVE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Métrica 1: Dinero en la Calle */}
        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              DINERO EN LA CALLE
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
              RD$ {currentTotalStreetMoney.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Total pendiente de cobro</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-rose-50 rounded-2xl text-rose-600 shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Métrica 2: Vecinos con Deuda */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              VECINOS CON DEUDA
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              {currentTotalDebtors}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Cuentas activas</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-50 rounded-2xl text-amber-600 shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Métrica 3: Botellas y Envases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              BOTELLAS VACÍAS
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
              {currentBottleDebtors}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Vecinos con envases</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
            <Wine className="h-6 w-6" />
          </div>
        </div>

        {/* Métrica 4: Total Clientes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              CARTERA TOTAL
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {clients.length}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Vecinos registrados</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-slate-100 rounded-2xl text-slate-600 shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. BUSCADOR Y FILTROS RÁPIDOS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por apodo, nombre o teléfono (ej. 'Doña Carmen', 'El Moreno', '809')..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveFilter('CON_DEUDA')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'CON_DEUDA' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Con Deuda ({currentTotalDebtors})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('TODOS')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'TODOS' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({clients.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('LIMITE_ALTO')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'LIMITE_ALTO' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Límite Alto
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('BOTELLAS')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'BOTELLAS' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Botellas ({currentBottleDebtors})
            </button>
          </div>
        </div>

        {/* 4. LISTA DE VECINOS Y CUENTAS */}
        <div className="divide-y divide-slate-100 pt-1">
          {filteredClients.map(client => {
            const debt = client.creditBalance || 0
            const limit = client.creditLimit || 3000
            const percent = Math.min(100, Math.round((debt / limit) * 100))
            const isNearLimit = percent >= 80

            return (
              <div
                key={client.id}
                className="py-3.5 sm:py-4 px-1 sm:px-2 hover:bg-slate-50/80 rounded-xl transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                {/* Info Principal */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 text-sm sm:text-base">
                      {client.nickname || client.name}
                    </span>
                    {client.nickname && client.name !== client.nickname && (
                      <span className="text-xs text-slate-500 font-normal">
                        ({client.name})
                      </span>
                    )}
                    {isNearLimit && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Límite {percent}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    {client.phone && (
                      <span className="flex items-center gap-1 font-medium">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {client.phone}
                      </span>
                    )}
                    {client.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {client.address}
                      </span>
                    )}
                    {client.bottleDebt && (
                      <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                        <Wine className="h-3.5 w-3.5 text-blue-600" />
                        {client.bottleDebt}
                      </span>
                    )}
                  </div>
                </div>

                {/* Balances y Barra de Límite */}
                <div className="w-full md:w-56 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400 font-semibold">Deuda actual:</span>
                    <span className={`text-base font-black ${debt > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      RD$ {debt.toFixed(2)}
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isNearLimit ? 'bg-rose-500' : debt > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Límite: RD$ {limit.toLocaleString()}</span>
                    <span>{percent}% usado</span>
                  </div>
                </div>

                {/* BOTONERA DE ACCIÓN POR CLIENTE */}
                <div className="flex items-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0 flex-wrap sm:flex-nowrap">
                  {/* Botón Anotar Fiao Rápido a este vecino */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClientId(client.id)
                      setShowAnotarModal(true)
                    }}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-2 rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
                    title="Anotar nuevo fiao"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Fiar</span>
                  </button>

                  {/* Botón Abonar */}
                  <button
                    type="button"
                    onClick={() => {
                      setAbonoModalClient(client)
                      setAbonoAmount('')
                      setBottleReturned('')
                      setAbonoNotes('')
                    }}
                    disabled={debt <= 0}
                    className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:pointer-events-none text-white px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Registrar abono"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Abonar</span>
                  </button>

                  {/* Botón Ver Libreta / Historial */}
                  <button
                    type="button"
                    onClick={() => openClientHistory(client)}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Ver cuentas y recibos"
                  >
                    <History className="h-3.5 w-3.5 text-slate-500" />
                    <span>Libreta</span>
                  </button>

                  {/* Botón WhatsApp */}
                  {client.phone && debt > 0 && (
                    <button
                      type="button"
                      onClick={() => openWhatsAppReminder(client)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  )}

                  {/* Botón Editar */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalClient(client)
                      setEditNickname(client.nickname || '')
                      setEditLimit(String(client.creditLimit || 3000))
                      setEditBottleDebt(client.bottleDebt || '')
                      setEditPhone(client.phone || '')
                      setEditAddress(client.address || '')
                    }}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Editar datos del cliente"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}

          {filteredClients.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30 text-amber-500" />
              <p className="font-bold text-slate-700 text-sm">No se encontraron vecinos</p>
              <p className="text-xs text-slate-400 mt-0.5">Prueba con otro término de búsqueda o cambia de filtro</p>
              <button
                type="button"
                onClick={() => setShowNewClientModal(true)}
                className="mt-3 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                + Registrar Primer Vecino
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ANOTAR FIAO (SOLO TOTAL RD$ vs DETALLAR ARTÍCULOS)               */}
      {/* ========================================================================= */}
      {showAnotarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[95vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Anotar Fiao a la Cuenta
                  </h2>
                  <p className="text-xs text-slate-500">
                    Elige si solo digitar el total o detallar los productos que se llevó
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAnotarModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selector de Cliente */}
            <div className="shrink-0 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>¿A quién se le va a fiar?</span>
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(true)}
                  className="text-emerald-600 hover:underline flex items-center gap-1 font-bold"
                >
                  <Plus className="h-3 w-3" />
                  <span>Nuevo Vecino</span>
                </button>
              </div>

              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Selecciona el vecino o cliente --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nickname || c.name} {c.creditBalance > 0 ? `(Debe: RD$ ${c.creditBalance.toFixed(2)})` : '(Al día)'}
                  </option>
                ))}
              </select>

              {selectedClient && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs flex items-center justify-between">
                  <span className="text-amber-900 font-medium">
                    Deuda actual: <strong className="text-rose-600 font-black">RD$ {selectedClient.creditBalance.toFixed(2)}</strong>
                  </span>
                  <span className="text-slate-500">
                    Límite: RD$ {selectedClient.creditLimit.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* SELECTOR DE MODALIDAD (TABS: SOLO TOTAL vs DETALLADO) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setFiaoMode('DIRECTO')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  fiaoMode === 'DIRECTO'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>⚡ Solo Digitar Total</span>
              </button>
              <button
                type="button"
                onClick={() => setFiaoMode('DETALLADO')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  fiaoMode === 'DETALLADO'
                    ? 'bg-white text-amber-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListPlus className="h-4 w-4 text-amber-600" />
                <span>📋 Detallar Artículos</span>
              </button>
            </div>

            {/* CONTENIDO SEGÚN LA MODALIDAD */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              
              {/* OPCIÓN 1: SOLO DIGITAR TOTAL (MODO RÁPIDO) */}
              {fiaoMode === 'DIRECTO' ? (
                <div className="space-y-3.5 animate-in fade-in">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Monto Total a Fiar (RD$):</label>
                    
                    {/* Botonera rápida de montos dominicanos */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 my-2">
                      {[50, 100, 200, 350, 500, 1000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDirectAmount(String(amt))}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold text-slate-800 transition-colors"
                        >
                          RD$ {amt}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                        RD$
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={directAmount}
                        onChange={e => setDirectAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xl font-black text-emerald-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Concepto o detalle rápido (Opcional):</label>
                    <input
                      type="text"
                      value={directConcept}
                      onChange={e => setDirectConcept(e.target.value)}
                      placeholder="Ej. Compra de cena, víveres y embutidos, cervezas..."
                      className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">¿Dejó botellas o envases pendientes? (Opcional):</label>
                    <input
                      type="text"
                      value={directBottleDebt}
                      onChange={e => setDirectBottleDebt(e.target.value)}
                      placeholder="Ej. 2 Grandes de Presidente, 1 Botellón vacío"
                      className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                /* OPCIÓN 2: DETALLAR ARTÍCULOS */
                <div className="space-y-3.5 animate-in fade-in">
                  {/* Buscador de productos del catálogo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Agregar productos del colmado:</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={itemSearchQuery}
                        onChange={e => setItemSearchQuery(e.target.value)}
                        placeholder="Buscar cerveza, hielo, arroz, queso, salami..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Chips de productos rápidos */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addProductToDetailed(p)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 rounded-lg text-[11px] font-bold text-amber-900 whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>{p.name} (RD${p.price})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* O Agregar artículo libre (no en inventario) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      O Escribir Artículo Libre:
                    </span>
                    <div className="grid grid-cols-12 gap-1.5">
                      <input
                        type="text"
                        value={customItemName}
                        onChange={e => setCustomItemName(e.target.value)}
                        placeholder="Ej. Aguacate, Hielo picado..."
                        className="col-span-6 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none"
                      />
                      <input
                        type="number"
                        step="any"
                        value={customItemPrice}
                        onChange={e => setCustomItemPrice(e.target.value)}
                        placeholder="Precio RD$"
                        className="col-span-3 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none text-right"
                      />
                      <button
                        type="button"
                        onClick={addCustomItemToDetailed}
                        className="col-span-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>

                  {/* Lista de artículos en el fiao actual */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Artículos agregados ({detailedItems.length}):</span>
                      <span className="text-amber-800 font-black text-sm">
                        TOTAL: RD$ {detailedTotal.toFixed(2)}
                      </span>
                    </div>

                    {detailedItems.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        <ListPlus className="h-8 w-8 mx-auto mb-1 opacity-30 text-amber-600" />
                        <p className="text-xs font-semibold text-slate-600">No has agregado artículos aún</p>
                        <p className="text-[11px] text-slate-400">Toca un producto arriba o escribe un artículo libre</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {detailedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs gap-2"
                          >
                            <span className="flex-1 font-bold text-slate-800 truncate">
                              {item.description}
                            </span>

                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => updateDetailedItemQty(idx, item.quantity - 1)}
                                className="p-1 hover:bg-slate-100 text-slate-600"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="font-bold px-1 min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateDetailedItemQty(idx, item.quantity + 1)}
                                className="p-1 hover:bg-slate-100 text-slate-600"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <span className="font-black text-slate-900 min-w-[60px] text-right">
                              RD$ {item.total.toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateDetailedItemQty(idx, 0)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botellas */}
                  <div>
                    <input
                      type="text"
                      value={detailedBottleDebt}
                      onChange={e => setDetailedBottleDebt(e.target.value)}
                      placeholder="¿Debe envases/botellas? (Ej. 1 Grande, 1 Botellón)"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN FINAL DE GUARDAR FIAO */}
            <div className="pt-2 border-t border-slate-200 shrink-0">
              {fiaoMode === 'DIRECTO' ? (
                <button
                  type="button"
                  disabled={!selectedClientId || !directAmount || isProcessing}
                  onClick={handleSaveDirectFiao}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  <span>
                    {isProcessing ? 'Guardando en la libreta...' : `ANOTAR RD$ ${parseFloat(directAmount) || 0} AL FIAO`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!selectedClientId || detailedItems.length === 0 || isProcessing}
                  onClick={handleSaveDetailedFiao}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-2xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  <span>
                    {isProcessing ? 'Guardando...' : `CONFIRMAR FIAO DETALLADO (RD$ ${detailedTotal.toFixed(2)})`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGISTRAR NUEVO CLIENTE / VECINO                                */}
      {/* ========================================================================= */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">Registrar Nuevo Vecino / Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nombre Completo: *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej. Carmen Rodríguez"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Apodo popular en el barrio (Cómo le llamas):</label>
                <input
                  type="text"
                  value={newNickname}
                  onChange={e => setNewNickname(e.target.value)}
                  placeholder="Ej. Doña Carmen (Casa 14), El Moreno"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Teléfono / WhatsApp:</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="809-555-1234"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Límite de Fiao (RD$):</label>
                  <input
                    type="number"
                    value={newCreditLimit}
                    onChange={e => setNewCreditLimit(e.target.value)}
                    placeholder="3000"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Dirección o Referencia de Casa:</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  placeholder="Ej. Calle 3ra #14, al lado del colmado"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none"
                />
              </div>

              {/* Saldo inicial si ya traía deuda de papel */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1">
                <label className="font-black text-amber-900">¿Ya traía deuda de la libreta de papel? (RD$):</label>
                <input
                  type="number"
                  step="any"
                  value={newInitialDebt}
                  onChange={e => setNewInitialDebt(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-black text-rose-600 focus:outline-none"
                />
                <p className="text-[10px] text-amber-700">
                  Si le pones un monto aquí, se registrará de una vez como su balance pendiente.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-sm shadow-md transition-all cursor-pointer"
                >
                  {isProcessing ? 'Guardando...' : 'GUARDAR Y REGISTRAR VECINO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: HISTORIAL / LIBRETA COMPLETA DEL CLIENTE                         */}
      {/* ========================================================================= */}
      {historyModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Libreta de: {historyModalClient.nickname || historyModalClient.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Balance actual adeudado: <strong className="text-rose-600 font-black">RD$ {historyModalClient.creditBalance.toFixed(2)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHistoryModalClient(null)
                  setClientHistoryData(null)
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-slate-400">
                  Cargando libreta del cliente...
                </div>
              ) : clientHistoryData && (
                <>
                  <div className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Cuentas Fiadas Recientes:</span>
                    <span>{clientHistoryData.invoices.length} fiados</span>
                  </div>

                  {clientHistoryData.invoices.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-slate-400 text-center">
                      No tiene cuentas fiadas registradas en el sistema.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientHistoryData.invoices.map((inv, i) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-baseline font-black">
                            <span className="text-slate-900">{inv.number}</span>
                            <span className="text-rose-600 text-sm">RD$ {inv.total.toFixed(2)}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex justify-between">
                            <span>{new Date(inv.createdAt).toLocaleString('es-DO')}</span>
                            <span>{inv.notes || 'Fiao'}</span>
                          </div>

                          {/* Items si fue detallado */}
                          {inv.items && inv.items.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-200 space-y-1 text-[11px]">
                              {inv.items.map((item: any, itemIdx: number) => (
                                <div key={itemIdx} className="flex justify-between text-slate-600">
                                  <span>{item.quantity}x {item.description}</span>
                                  <span className="font-bold">RD$ {item.total.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Abonos realizados */}
                  <div className="font-bold text-slate-700 pt-3 border-t flex items-center justify-between">
                    <span>Abonos y Pagos Recibidos:</span>
                    <span>{clientHistoryData.payments.length} abonos</span>
                  </div>

                  {clientHistoryData.payments.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-slate-400 text-center">
                      Aún no ha realizado abonos.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientHistoryData.payments.map((pay, i) => (
                        <div key={i} className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex justify-between items-center">
                          <div>
                            <div className="font-bold text-emerald-900">
                              {pay.description || 'Abono en efectivo'}
                            </div>
                            <div className="text-[10px] text-emerald-700">
                              {new Date(pay.createdAt).toLocaleString('es-DO')}
                            </div>
                          </div>
                          <div className="font-black text-emerald-800 text-sm">
                            + RD$ {pay.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-2 border-t shrink-0 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalClient(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
              >
                Cerrar Libreta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REGISTRAR ABONO / PAGO                                           */}
      {/* ========================================================================= */}
      {abonoModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Abonar a: {abonoModalClient.nickname || abonoModalClient.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Deuda pendiente: <strong className="text-rose-600 font-black">RD$ {abonoModalClient.creditBalance.toFixed(2)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbonoModalClient(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Monto del Abono en Efectivo (RD$):</label>
                <div className="grid grid-cols-4 gap-1.5 my-2">
                  {[100, 200, 500, abonoModalClient.creditBalance].map((val, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAbonoAmount(String(val))}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold text-slate-800 transition-colors"
                    >
                      {idx === 3 ? 'Saldo Total' : `RD$ ${val}`}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="any"
                  value={abonoAmount}
                  onChange={e => setAbonoAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-black text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">¿Devolvió botellas o envases vacíos?</label>
                <input
                  type="text"
                  value={bottleReturned}
                  onChange={e => setBottleReturned(e.target.value)}
                  placeholder="Ej. Devolvió las 2 Grandes (Dejar vacío o escribir 'Al día')"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Nota del abono (Opcional):</label>
                <input
                  type="text"
                  value={abonoNotes}
                  onChange={e => setAbonoNotes(e.target.value)}
                  placeholder="Ej. Pagó en efectivo en mostrador"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                disabled={!abonoAmount || isProcessing}
                onClick={handleRecordAbono}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                {isProcessing ? 'Registrando Abono...' : 'REGISTRAR ABONO Y ACTUALIZAR DEUDA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDITAR CLIENTE                                                  */}
      {/* ========================================================================= */}
      {editModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">
                Editar Datos de {editModalClient.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalClient(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Apodo popular:</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={e => setEditNickname(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Límite (RD$):</label>
                  <input
                    type="number"
                    value={editLimit}
                    onChange={e => setEditLimit(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Teléfono / WhatsApp:</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700">Dirección:</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Envases / Botellas:</label>
                <input
                  type="text"
                  value={editBottleDebt}
                  onChange={e => setEditBottleDebt(e.target.value)}
                  placeholder="Ej. 2 Grandes de Presidente, o 'Al día'"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveEdit}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                {isProcessing ? 'Guardando...' : 'GUARDAR CAMBIOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
