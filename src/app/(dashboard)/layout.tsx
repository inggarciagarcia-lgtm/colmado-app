import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { getCompanies, getActiveCompany } from "@/lib/actions/companies"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const companies = await getCompanies()
  const activeCompany = await getActiveCompany()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] print:block">
      <div className="hidden border-r bg-slate-50/40 md:block print:hidden">
        <Sidebar companyName={activeCompany.name} />
      </div>
      <div className="flex flex-col print:block">
        <Topbar companies={companies} activeCompany={activeCompany} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 print:p-0">
          {children}
        </main>
      </div>
    </div>
  )
}