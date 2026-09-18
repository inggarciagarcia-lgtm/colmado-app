import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, DollarSign, Users, ArrowRight, Building2, Store, BookOpen, Bike, Wine, Sparkles } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getActiveCompany } from "@/lib/actions/companies"
import { PwaInstallBanner } from "@/components/layout/pwa-install-button"
import { QuickExpenseBar } from "@/components/cash/quick-expense-bar"
import Link from "next/link"

export default async function Dashboard() {
  const company = await getActiveCompany()

  const [clients, transactions, productsCount] = await Promise.all([
    prisma.client.findMany({ where: { companyId: company.id } }),
    prisma.transaction.findMany({ where: { companyId: company.id } }),
    prisma.product.count({ where: { companyId: company.id } })
  ])
  
  const clientsCount = clients.length
  const totalFiaoOwed = clients.reduce((acc, c) => acc + c.creditBalance, 0)
  const debtorsCount = clients.filter(c => c.creditBalance > 0).length
  const bottleDebtorsCount = clients.filter(c => c.bottleDebt && c.bottleDebt !== 'Al día').length

  const totalCobrar = transactions
    .filter(t => t.type === 'INCOME' && t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amount, 0)
    
  const totalPagar = transactions
    .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amount, 0)
    
  const balance = transactions
    .filter(t => t.status === 'PAID')
    .reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0)

  const pendingIncomesCount = transactions.filter(t => t.type === 'INCOME' && t.status === 'PENDING').length
  const pendingExpensesCount = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').length

  return (
    <div className="space-y-6">
      <PwaInstallBanner />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{company.name}</h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Colmado Activo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {company.address || 'Herrera, Santo Domingo'} • Tel: {company.phone || '809-555-2424'}
          </p>
        </div>

        {/* ACCESOS DIRECTOS PRINCIPALES */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/pos"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl shadow-md transition-all text-xs cursor-pointer active:scale-95"
          >
            <Store className="h-4 w-4" />
            <span>ABRIR MOSTRADOR POS</span>
          </Link>
          <Link
            href="/fiao"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all text-xs cursor-pointer"
          >
            <BookOpen className="h-4 w-4" />
            <span>LIBRETA DE FIAO</span>
          </Link>
        </div>
      </div>

      {/* BANNER DESTACADO PARA OPERACIÓN DIARIA DE COLMADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mostrador Express */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                Mostrador Táctil de Ventas
              </span>
              <Store className="h-6 w-6 text-emerald-200" />
            </div>
            <h2 className="text-xl font-black mt-3">Facturación Rápida de Mostrador</h2>
            <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
              Botonera táctil de frías, hielo, víveres y provisiones. Venta fraccionada por libra o por dinero RD$, calculadora de devuelta y despacho por delivery.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-100 font-semibold">{productsCount} productos listos</span>
            <Link
              href="/pos"
              className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Facturar Ahora</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Libreta de Fiao */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                Control de Crédito Vecinal
              </span>
              <BookOpen className="h-6 w-6 text-amber-200" />
            </div>
            <h2 className="text-xl font-black mt-3">Libreta Digital del Fiao</h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xs text-amber-100 font-medium">Dinero en la Calle:</span>
              <span className="text-2xl font-black">
                RD$ {totalFiaoOwed.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-amber-100 mt-1">
              {debtorsCount} vecinos con balance pendiente • {bottleDebtorsCount} con botellas vacías
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs text-amber-100 font-semibold">Cobros por WhatsApp listos</span>
            <Link
              href="/fiao"
              className="bg-white text-amber-900 hover:bg-amber-50 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Ver Libreta y Abonar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <QuickExpenseBar 
        title="Control de Caja Diaria y Pagos a Camiones / Suplidores"
        subtitle="Registra lo que pagaste hoy en efectivo (Cervecería, Mercasid, embutidos, hielo o empleados) para cuadrar la caja al cierre."
      />

      {/* MÉTRICAS FINANCIERAS */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {/* Balance Neto */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Balance Neto en Caja
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black font-mono ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              RD${balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresos cobrados - Gastos del colmado
            </p>
          </CardContent>
        </Card>

        {/* Por Cobrar / Fiao */}
        <Link href="/fiao" className="group">
          <Card className="shadow-xs hover:border-amber-300 transition-all cursor-pointer h-full border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-amber-700">
                Fiao Pendiente de Cobro
              </CardTitle>
              <BookOpen className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600 font-mono">
                RD${totalFiaoOwed.toFixed(2)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {debtorsCount} vecinos en libreta
                </p>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Por Pagar (Camiones/Proveedores) */}
        <Link href="/payables" className="group">
          <Card className="shadow-xs hover:border-rose-300 transition-all cursor-pointer h-full border-l-4 border-l-rose-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-rose-700">
                Por Pagar (Suplidores)
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-600 font-mono">-RD${totalPagar.toFixed(2)}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground font-medium text-rose-600">
                  {pendingExpensesCount} facturas pendientes
                </p>
                <ArrowRight className="h-3 w-3 text-rose-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Vecinos y Contactos */}
        <Link href="/contacts" className="group">
          <Card className="shadow-xs hover:border-indigo-300 transition-all cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-indigo-700">
                Vecinos y Proveedores
              </CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 font-mono">{clientsCount}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Directorio de clientes y suplidores
                </p>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
