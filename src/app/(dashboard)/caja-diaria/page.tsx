import { getDailyCashSummary } from "@/lib/actions/cash-movements"
import { getProducts } from "@/lib/actions/products"
import { CajaDiariaClient } from "./caja-client"

export default async function CajaDiariaPage({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const params = await searchParams
  const todayStr = new Date().toISOString().split('T')[0]
  const dateStr = params.date || todayStr

  const [summary, products] = await Promise.all([
    getDailyCashSummary(dateStr),
    getProducts()
  ])

  return (
    <div className="max-w-6xl mx-auto w-full py-2">
      <CajaDiariaClient
        initialData={summary}
        products={products}
        currentDate={dateStr}
      />
    </div>
  )
}
