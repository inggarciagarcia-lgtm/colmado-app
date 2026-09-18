import Link from 'next/link'
import { Home, Users, CreditCard, Package, ReceiptText, ArrowDownCircle, Wallet, Store, BookOpen, Sparkles } from 'lucide-react'

export function Sidebar({ companyName = "Mi Negocio" }: { companyName?: string }) {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-50/40">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 truncate">
          <Store className="h-6 w-6 text-emerald-600 shrink-0" />
          <span className="truncate max-w-[190px]" title={companyName}>{companyName}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Mostrador y Colmado
          </div>
          <Link
            href="/pos"
            className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Store className="h-4 w-4" />
              <span>Mostrador POS</span>
            </div>
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
              Rápido
            </span>
          </Link>
          <Link
            href="/fiao"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-amber-900 bg-amber-50 hover:bg-amber-100 font-bold border border-amber-200 transition-all"
          >
            <BookOpen className="h-4 w-4 text-amber-600" />
            Libreta de Fiao
          </Link>
          <Link
            href="/caja-diaria"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-emerald-700 bg-emerald-50/70 transition-all hover:text-emerald-800 hover:bg-emerald-100/70 font-bold"
          >
            <Wallet className="h-4 w-4 text-emerald-600" />
            Caja y Gastos Efectivo
          </Link>

          <div className="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Facturación DGII
          </div>
          <Link
            href="/invoices"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-all hover:text-slate-900 hover:bg-slate-100 font-semibold"
          >
            <ReceiptText className="h-4 w-4 text-emerald-600" />
            Comprobantes (NCF)
          </Link>
          <Link
            href="/transactions"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <CreditCard className="h-4 w-4 text-blue-600" />
            Cuentas por Cobrar
          </Link>

          <div className="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Gastos y Proveedores
          </div>
          <Link
            href="/payables"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-all hover:text-slate-900 hover:bg-slate-100 font-semibold"
          >
            <ArrowDownCircle className="h-4 w-4 text-rose-600" />
            Cuentas por Pagar
          </Link>
          <Link
            href="/contacts"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <Users className="h-4 w-4 text-indigo-600" />
            Vecinos y Suplidores
          </Link>

          <div className="pt-2 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Inventario
          </div>
          <Link
            href="/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            <Package className="h-4 w-4 text-amber-600" />
            Productos y Stock
          </Link>
        </nav>
      </div>
    </div>
  )
}
