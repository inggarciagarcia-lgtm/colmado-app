'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export async function getProducts() {
  const company = await getActiveCompany()
  return await prisma.product.findMany({
    where: { companyId: company.id },
    orderBy: { name: 'asc' }
  })
}

export async function createProduct(formData: FormData) {
  const company = await getActiveCompany()
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string) || 0
  const stock = parseInt(formData.get('stock') as string) || 0
  const hasItbis = formData.get('hasItbis') !== 'false'

  await prisma.product.create({
    data: { 
      companyId: company.id,
      name, 
      description, 
      price, 
      stock,
      hasItbis
    }
  })

  revalidatePath('/products')
  revalidatePath('/invoices/new')
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id }
  })
  revalidatePath('/products')
  revalidatePath('/invoices/new')
}