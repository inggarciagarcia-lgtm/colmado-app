'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ReceiptText, Lock } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const executeLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Correo o contraseña incorrectos.')
        setLoading(false)
      } else {
        // Redirigir directamente al panel
        window.location.href = '/'
      }
    } catch (err) {
      // Si fetch falla por red, enviar el formulario de manera nativa HTML
      const form = document.getElementById('login-form') as HTMLFormElement
      if (form) form.submit()
    }
  }

  const handleQuickLogin = (e: React.MouseEvent) => {
    e.preventDefault()
    setEmail('ing.garciagarcia@gmail.com')
    setPassword('123456')
    executeLogin('ing.garciagarcia@gmail.com', '123456')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    executeLogin(email, password)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="flex justify-center pb-2">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <ReceiptText className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">Gestor Negocio</CardTitle>
          <CardDescription className="text-xs">
            Sistema de Facturación Fiscal (DGII), Cuentas e Inventario
          </CardDescription>
        </CardHeader>
        <form id="login-form" action="/api/direct-login" method="POST" onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg text-center">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Correo Electrónico
              </Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="ing.garciagarcia@gmail.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Contraseña
              </Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                placeholder="••••••"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2.5 pt-2">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 cursor-pointer" type="submit" disabled={loading}>
              <Lock className="mr-2 h-4 w-4" />
              {loading ? "Entrando al sistema..." : "Iniciar Sesión"}
            </Button>

            <Button 
              type="button"
              variant="outline"
              onClick={handleQuickLogin}
              disabled={loading}
              className="w-full border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold h-9 cursor-pointer"
            >
              ⚡ Ingresar Rápido (1 Clic)
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}