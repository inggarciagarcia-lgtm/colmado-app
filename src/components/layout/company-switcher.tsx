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