import Link from "next/link";
import { Apple, Monitor, Smartphone, Store, Download, CheckCircle2, ArrowRight } from "lucide-react";

export default function DescargarPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full pt-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" /> Colmado & Negocio RD
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Descargas del Sistema
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Selecciona tu dispositivo para descargar la aplicación oficial o entra directamente al mostrador de facturación.
          </p>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Mac Installer Card */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all hover:scale-[1.01]">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white mb-4 shadow">
                <Apple className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Para Apple Mac</h2>
              <p className="text-xs text-emerald-400 font-medium mb-3">macOS Sonoma, Sequoia y anteriores (Apple Silicon & Intel)</p>
              <p className="text-slate-400 text-sm mb-4">
                Paquete instalador oficial con icono nativo y ventana de mostrador dedicada para tu Mac.
              </p>
              <div className="space-y-1.5 text-xs text-slate-300 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Incluye punto de venta POS y Libreta de Fiao</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Apertura rápida con un solo clic</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="/api/download?file=mac"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition-colors shadow-lg shadow-emerald-600/20 text-sm"
              >
                <Download className="w-4 h-4" />
                Descargar Instalador Mac (.dmg)
              </a>
              <a
                href="/Gestor_Negocio_Mac.dmg"
                download="Gestor_Negocio_Mac.dmg"
                className="w-full text-center block text-xs text-slate-400 hover:text-slate-200 py-1"
              >
                Enlace alternativo directo (.dmg)
              </a>
            </div>
          </div>

          {/* Windows Installer Card */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all hover:scale-[1.01]">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-900/40 border border-blue-700/40 flex items-center justify-center text-blue-400 mb-4 shadow">
                <Monitor className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Para Windows PC</h2>
              <p className="text-xs text-blue-400 font-medium mb-3">Windows 10 y Windows 11 (64-bit)</p>
              <p className="text-slate-400 text-sm mb-4">
                Instalador ejecutable .exe preparado para tu computadora de caja o mostrador.
              </p>
              <div className="space-y-1.5 text-xs text-slate-300 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Instalador automático con acceso directo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Totalmente compatible con impresoras térmicas</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="/api/download?file=windows"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-colors shadow-lg shadow-blue-600/20 text-sm"
              >
                <Download className="w-4 h-4" />
                Descargar para Windows (.exe)
              </a>
              <a
                href="/Instalador_Gestor_Negocio.exe"
                download="Instalador_Gestor_Negocio.exe"
                className="w-full text-center block text-xs text-slate-400 hover:text-slate-200 py-1"
              >
                Enlace alternativo directo (.exe)
              </a>
            </div>
          </div>
        </div>

        {/* Direct Access & Phone Info */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-700/40 flex items-center justify-center text-purple-400 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">¿Estás en tu Celular o Tablet?</h3>
              <p className="text-xs text-slate-400">
                Puedes instalar la App directamente abriendo el sistema en Chrome o Safari y tocando &quot;Agregar a la pantalla de inicio&quot;.
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors border border-slate-700"
          >
            <span>Entrar al Sistema Web</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 py-4">
        Gestor de Negocio & Facturación Dominicana © {new Date().getFullYear()} — Diseñado para Colmados y Comercios
      </footer>
    </div>
  );
}
