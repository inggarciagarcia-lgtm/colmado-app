import { getFiaoDashboardData } from '@/lib/actions/fiao-app'
import { getActiveCompany } from '@/lib/actions/companies'
import { FiaoClient } from './fiao-client'

export const dynamic = 'force-dynamic'

export default async function FiaoPage() {
  const [data, company] = await Promise.all([
    getFiaoDashboardData(),
    getActiveCompany()
  ])

  return (
    <FiaoClient
      initialClients={data.clients}
      products={data.products}
      totalStreetMoney={data.totalStreetMoney}
      totalDebtors={data.totalDebtors}
      totalBottleDebtors={data.totalBottleDebtors}
      company={company}
    />
  )
}
