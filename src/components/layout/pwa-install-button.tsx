'use client'

import { useState, useEffect } from "react"
import { Smartphone, Download, X, CheckCircle2 } from "lucide-react"

export function PwaInstallBanner() {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       (window.navigator as any).standalone === true)
    ) {
      setIsInstalled(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (isInstalled || isDismissed) return null

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-emerald-600/50 relative">
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 p-1.5 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-800/80 cursor-pointer"
        aria-label="Cerrar aviso"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2.5 mb-2 text-emerald-200 pr-8">
        <Smartphone className="h-6 w-6 text-emerald-400 shrink-0" />
        <h3 className="font-black text-base sm:text-lg text-white">
          Instalar Gestor Negocio como App Real (Sin Chrome)
        </h3>
      </div>

      <p className="text-xs text-emerald-100/90 mb-4 max-w-2xl leading-relaxed">
        Para que la aplicación abra en su propia pantalla completa independiente (sin barra de direcciones ni pestañas de navegador), sigue estos pasos:
      </p>

      {deferredPrompt && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/30 text-sm cursor-pointer active:scale-95 transition-all"
          >
            <Download className="h-5 w-5" />
            Toca aquí para Instalar la App en tu Celular
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-emerald-900/80 p-3.5 rounded-xl border border-emerald-700/60">
          <div className="font-bold text-amber-300 mb-1.5 flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0">1</span>
            En Chrome (Arriba a la derecha)
          </div>
          <p className="text-emerald-100 leading-relaxed">
            Toca los <strong>tres puntos verticales ( ⋮ )</strong> en la esquina superior derecha del navegador.
          </p>
        </div>

        <div className="bg-emerald-900/80 p-3.5 rounded-xl border border-emerald-700/60">
          <div className="font-bold text-amber-300 mb-1.5 flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0">2</span>
            Elige "Instalar aplicación"
          </div>
          <p className="text-emerald-100 leading-relaxed">
            Busca y toca <strong>"Instalar aplicación"</strong> (o <em>"Instalar Gestor Negocio"</em>). Luego pulsa <strong>Instalar</strong>.
          </p>
        </div>

        <div className="bg-emerald-900/80 p-3.5 rounded-xl border border-emerald-700/60">
          <div className="font-bold text-amber-300 mb-1.5 flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0">3</span>
            Abre la nueva App
          </div>
          <p className="text-emerald-100 leading-relaxed">
            Ve a tu pantalla principal. <strong>Borra el acceso directo viejo</strong> de Chrome y abre el nuevo ícono de <strong>Gestor Negocio</strong>. ¡Abrirá en pantalla completa como app nativa!
          </p>
        </div>
      </div>
    </div>
  )
}

export function PwaInstallButton() {
  return null
}
