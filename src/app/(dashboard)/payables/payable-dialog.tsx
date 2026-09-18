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