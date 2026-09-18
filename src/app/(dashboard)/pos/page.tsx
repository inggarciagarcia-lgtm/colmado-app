import { getColmadoProducts, getColmadoClients } from '@/lib/actions/colmado-pos'
import { getActiveCompany } from '@/lib/actions/companies'
import { PosClient } from './pos-client'

export const dynamic = 'force-dynamic'

export default async function PosPage() {
  const [products, clients, company] = await Promise.all([
    getColmadoProducts(),
    getColmadoClients(),
    getActiveCompany()
  ])

  return (
    <PosClient
      initialProducts={products}
      initialClients={clients}
      company={company}
    />
  )
}
