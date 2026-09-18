'use client'

import { useState } from "react"
import { CircleUser, Menu, Home, Users, CreditCard, Package, ReceiptText, ArrowDownCircle, X, Wallet, Store, BookOpen } from "lucide-react"
import { CompanySwitcher } from "./company-switcher"
import { PwaInstallButton } from "./pwa-install-button"
import { signOut } from "next-auth/react"
import Link from "next/link"

interface Company {
  id: string
  name: string
  rnc: string | null
}

export function Topbar({ 
  companies, 
  activeCompany 
}: { 
  companies: Company[]
  activeCompany: Company 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-slate-50/80 px-4 lg:h-[60px] lg:px-6 print:hidden relative z-30">
      {/* Botón Menú Móvil */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Menú Lateral Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Fondo oscuro para cerrar al tocar fuera */}
          <div 
            className="fixed inset-0 bg-black/60 transition-opacity" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          {/* Panel del menú */}
          <div className="relative z-10 w-72 max-w-[80vw] bg-white h-full p-5 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-2 truncate pr-2">
                <Store className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-900 truncate">{activeCompany.name}</span>
              </div>
              <button 
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="grid gap-1 text-sm font-medium">
              <Link
                href="/pos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-emerald-600 text-white font-black shadow-xs mb-1"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="h-4 w-4" />
                  <span>Mostrador POS</span>
                </div>
                <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase">
                  Express
                </span>
              </Link>
              <Link
                href="/fiao"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 mb-1"
              >
                <BookOpen className="h-4 w-4 text-amber-600" />
                Libreta de Fiao
              </Link>
              <Link
                href="/caja-diaria"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
              >
                <Wallet className="h-4 w-4 text-emerald-600" />
                Caja y Gastos Efectivo
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <Home className="h-4 w-4 text-slate-500" />
                Dashboard
              </Link>
              <Link
                href="/invoices"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
              >
                <ReceiptText className="h-4 w-4 text-slate-500" />
                Facturación (NCF)
              </Link>
              <Link
                href="/transactions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <CreditCard className="h-4 w-4 text-slate-500" />
                Cuentas por Cobrar
              </Link>
              <Link
                href="/payables"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50"
              >
                <ArrowDownCircle className="h-4 w-4 text-rose-600" />
                Cuentas por Pagar
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <Package className="h-4 w-4 text-slate-500" />
                Productos y Stock
              </Link>
              <Link
                href="/contacts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <Users className="h-4 w-4 text-slate-500" />
                Vecinos y Contactos
              </Link>
            </nav>

            <div className="mt-auto pt-4 border-t flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-600">Acceso Móvil</p>
              <PwaInstallButton />
            </div>
          </div>
        </div>
      )}

      {/* Selector Multi-Empresa en la barra superior */}
      <div className="flex-1 flex items-center gap-2 sm:gap-3">
        <CompanySwitcher companies={companies} activeCompany={activeCompany} />
        
        {/* Acceso directo Mostrador POS */}
        <Link
          href="/pos"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all shrink-0"
        >
          <Store className="h-4 w-4" />
          <span className="hidden sm:inline">Mostrador POS</span>
          <span className="sm:hidden">POS</span>
        </Link>

        {/* Acceso directo Fiao */}
        <Link
          href="/fiao"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shrink-0"
        >
          <BookOpen className="h-3.5 w-3.5 text-amber-600" />
          <span>Libreta Fiao</span>
        </Link>

        {/* Acceso directo Caja Diaria */}
        <Link
          href="/caja-diaria"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shrink-0"
        >
          <Wallet className="h-3.5 w-3.5 text-emerald-600" />
          <span>Caja Diaria</span>
        </Link>
      </div>

      <PwaInstallButton />

      {/* Menú de Usuario con estado simple */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer flex items-center justify-center transition-colors"
          aria-label="Menú de usuario"
        >
          <CircleUser className="h-5 w-5" />
        </button>

        {userMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setUserMenuOpen(false)} 
            />
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b">
                <p className="text-xs text-slate-400 font-medium">Empresa actual</p>
                <p className="font-bold text-slate-800 truncate">{activeCompany.name}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="block px-3 py-2 text-slate-700 hover:bg-slate-100 cursor-pointer font-medium"
              >
                Ajustes de Empresas
              </Link>
              <div className="border-t my-1" />
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 cursor-pointer font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
