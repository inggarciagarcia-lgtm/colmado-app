'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle2, Wallet, ShoppingCart, UserCheck, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCashMovement } from '@/lib/actions/cash-movements'

export function QuickExpenseBar({
  title = "Registrar Pago Diario en Efectivo",
  subtitle = "Escribe lo que pagaste hoy con dinero de la venta y regístralo al instante."
}: {
  title?: string
  subtitle?: string
}) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<'COMPRA_PRODUCTOS' | 'PAGO_EMPLEADOS' | 'OTROS_GASTOS'>('COMPRA_PRODUCTOS')
  const [responsible, setResponsible] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (!description.trim()) {
      alert('Por favor escribe qué fue lo que se pagó.')
      return
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.')
      return
    }

    setLoading(true)
    try {
      await createCashMovement({
        category,
        description: description.trim(),
        amount: parsedAmount,
        responsible: responsible.trim() || undefined
      })

      const registeredDesc = description
      const registeredAmt = parsedAmount.toFixed(2)

      setDescription('')
      setAmount('')
      setResponsible('')
      setSuccessMsg(`✓ ¡Registrado con éxito: ${registeredDesc} (RD$${registeredAmt})!`)
      setTimeout(() => setSuccessMsg(''), 4000)

      router.refresh()
    } catch (err: any) {
      alert('Error al registrar: ' + (err?.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-white leading-tight">{title}</h2>
            <p className="text-xs text-slate-300">{subtitle}</p>
          </div>
        </div>

        {/* Selector visual de tipo de pago */}
        <div className="flex rounded-lg bg-slate-800/80 p-1 border border-slate-700 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setCategory('COMPRA_PRODUCTOS')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              category === 'COMPRA_PRODUCTOS' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Compra de Productos</span>
          </button>
          <button
            type="button"
            onClick={() => setCategory('PAGO_EMPLEADOS')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              category === 'PAGO_EMPLEADOS' 
                ? 'bg-purple-600 text-white shadow' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Pago a Empleado</span>
          </button>
          <button
            type="button"
            onClick={() => setCategory('OTROS_GASTOS')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              category === 'OTROS_GASTOS' 
                ? 'bg-amber-600 text-white shadow' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Coffee className="h-3.5 w-3.5" />
            <span>Otro Gasto</span>
          </button>
        </div>
      </div>

      {/* Formulario directo de 1 línea */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* ¿Qué se pagó? */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
              {category === 'COMPRA_PRODUCTOS' ? '🛒 ¿Qué compraste?' : 
               category === 'PAGO_EMPLEADOS' ? '👷 ¿Concepto del pago?' : 
               '⚡ ¿Qué gasto se pagó?'}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                category === 'COMPRA_PRODUCTOS' ? 'Ej. 2 sacos de harina, leche, huevos...' :
                category === 'PAGO_EMPLEADOS' ? 'Ej. Sueldo del día, propina, horas extra...' :
                'Ej. 3 fundas de hielo, pasaje delivery, gas...'
              }
              className="h-11 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 font-medium focus-visible:ring-emerald-500 text-sm"
              required
            />
          </div>

          {/* Pagado a / Responsable */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
              {category === 'PAGO_EMPLEADOS' ? 'Nombre del Empleado' : 'Pagado a / Lugar (opcional)'}
            </label>
            <Input
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder={
                category === 'PAGO_EMPLEADOS' ? 'Ej. Juan Pérez' :
                'Ej. Colmado, Repartidor...'
              }
              className="h-11 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 font-medium focus-visible:ring-emerald-500 text-sm"
            />
          </div>

          {/* Monto en RD$ */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-emerald-400 mb-1 uppercase tracking-wider">
              Monto Pagado (RD$)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-11 bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-mono font-bold text-right text-base placeholder:text-emerald-700/60 focus-visible:ring-emerald-400"
              required
            />
          </div>

          {/* Botón de Enviar */}
          <div className="sm:col-span-2 flex items-end">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>{loading ? 'Guardando...' : 'REGISTRAR'}</span>
            </Button>
          </div>
        </div>

        {/* Mensaje de confirmación verde */}
        {successMsg && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
        )}
      </form>
    </div>
  )
}
