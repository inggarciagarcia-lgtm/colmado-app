'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateActiveCompany, deleteCompany } from "@/lib/actions/companies"
import { Check, Building2, Receipt, Save, Trash2 } from "lucide-react"

interface Company {
  id: string
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

export function SettingsForm({ 
  companies, 
  activeCompany 
}: { 
  companies: Company[]
  activeCompany: Company 
}) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    const formData = new FormData(e.currentTarget)
    try {
      await updateActiveCompany(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      alert("Error al guardar la configuración")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (confirm(`¿Estás seguro de que deseas eliminar la empresa "${name}"? Esta acción borrará sus facturas y datos asociados.`)) {
      try {
        await deleteCompany(id)
      } catch (err: any) {
        alert(err.message || "Error al eliminar empresa")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Lista de Empresas */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Todas tus Empresas ({companies.length})</CardTitle>
              <CardDescription>
                Empresas creadas en este sistema. Puedes cambiar entre ellas usando el selector arriba a la izquierda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 divide-y">
          {companies.map(c => {
            const isActive = c.id === activeCompany.id
            return (
              <div key={c.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{c.name}</span>
                      {isActive && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          En Uso Actualmente
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      RNC: {c.rnc || 'Sin RNC'} • {c.phone || 'Sin teléfono'}
                    </div>
                  </div>
                </div>

                {companies.length > 1 && !isActive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id, c.name)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Formulario de la Empresa Activa */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900">
                  Editar Empresa Activa: <span className="text-emerald-700 font-extrabold">{activeCompany.name}</span>
                </CardTitle>
                <CardDescription>
                  Cambia el nombre, RNC, teléfonos y datos de facturación de esta empresa.
                </CardDescription>
              </div>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold shadow-xs">
                <Save className="h-4 w-4" />
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-bold text-slate-800">
                  Nombre de la Empresa o Razón Social *
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={activeCompany.name}
                  placeholder="Ej. Comercializadora Quisqueya, SRL"
                  className="font-medium text-base h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rnc" className="text-sm font-bold text-slate-800">
                  RNC de la Empresa *
                </Label>
                <Input
                  id="rnc"
                  name="rnc"
                  defaultValue={activeCompany.rnc || ''}
                  placeholder="Ej. 1-30-12345-6"
                  className="font-mono text-base h-11"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                  Teléfono de Contacto
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={activeCompany.phone || ''}
                  placeholder="Ej. 809-555-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={activeCompany.email || ''}
                  placeholder="contacto@empresa.do"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-semibold text-slate-700">
                Dirección Física / Comercial
              </Label>
              <Input
                id="address"
                name="address"
                defaultValue={activeCompany.address || ''}
                placeholder="Ej. Av. Winston Churchill #45, Santo Domingo, D.N."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slogan" className="text-sm font-semibold text-slate-700">
                Mensaje o Términos al pie de la Factura
              </Label>
              <Input
                id="slogan"
                name="slogan"
                defaultValue={activeCompany.slogan || ''}
                placeholder="Ej. ¡Gracias por su compra! No se aceptan devoluciones sin factura."
              />
            </div>
          </CardContent>
        </Card>

        {/* Secuencias NCF de esta empresa */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Control de Secuencias NCF de {activeCompany.name}</CardTitle>
                <CardDescription>
                  Cada empresa tiene su propio correlativo de comprobantes autorizado por la DGII.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ncfB02Seq" className="text-sm font-semibold text-slate-700">
                  Próximo Consumidor Final (B02)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-500">B02</span>
                  <Input
                    id="ncfB02Seq"
                    name="ncfB02Seq"
                    type="number"
                    min="1"
                    defaultValue={activeCompany.ncfB02Seq}
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ncfB01Seq" className="text-sm font-semibold text-slate-700">
                  Próximo Crédito Fiscal (B01)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-500">B01</span>
                  <Input
                    id="ncfB01Seq"
                    name="ncfB01Seq"
                    type="number"
                    min="1"
                    defaultValue={activeCompany.ncfB01Seq}
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ncfB15Seq" className="text-sm font-semibold text-slate-700">
                  Próximo Gubernamental (B15)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-500">B15</span>
                  <Input
                    id="ncfB15Seq"
                    name="ncfB15Seq"
                    type="number"
                    min="1"
                    defaultValue={activeCompany.ncfB15Seq}
                    className="font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="ncfExpiry" className="text-sm font-semibold text-slate-700">
                Fecha de Vencimiento de Secuencia NCF
              </Label>
              <Input
                id="ncfExpiry"
                name="ncfExpiry"
                defaultValue={activeCompany.ncfExpiry || '31/12/2026'}
                placeholder="Ej. 31/12/2026"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              {saved ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">
                  <Check className="h-4 w-4" /> ¡Empresa actualizada exitosamente!
                </span>
              ) : <span />}

              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-xs">
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : "Guardar Cambios de la Empresa"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}