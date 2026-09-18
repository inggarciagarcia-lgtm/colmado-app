'use server'

import { prisma } from '@/lib/prisma'
import { getActiveCompany } from './companies'
import { revalidatePath } from 'next/cache'

export async function getContacts() {
  const company = await getActiveCompany()
  return await prisma.client.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createContact(formData: FormData) {
  const company = await getActiveCompany()
  const name = formData.get('name') as string
  const rnc = (formData.get('rnc') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null
  const type = (formData.get('type') as string) || 'CLIENT'

  await prisma.client.create({
    data: { 
      companyId: company.id,
      name, 
      rnc, 
      email, 
      phone, 
      address, 
      type 
    }
  })

  revalidatePath('/contacts')
  revalidatePath('/invoices/new')
}

export async function deleteContact(id: string) {
  await prisma.client.delete({
    where: { id }
  })
  revalidatePath('/contacts')
  revalidatePath('/invoices/new')
}