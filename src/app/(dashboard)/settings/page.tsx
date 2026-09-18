import { getCompanies, getActiveCompany } from "@/lib/actions/companies"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const companies = await getCompanies()
  const activeCompany = await getActiveCompany()

  return (
    <div className="max-w-4xl mx-auto w-full py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ajustes y Gestión Multi-Empresa</h1>
        <p className="text-sm text-muted-foreground">Administra tus empresas registradas, sus datos fiscales y secuencias de NCF.</p>
      </div>

      <SettingsForm companies={companies} activeCompany={activeCompany} />
    </div>
  )
}