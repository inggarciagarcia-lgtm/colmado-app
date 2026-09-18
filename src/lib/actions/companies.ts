'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getActiveCompany() {
  const cookieStore = await cookies()
  const activeCompanyId = cookieStore.get('active_company_id')?.value

  if (activeCompanyId) {
    const company = await prisma.company.findUnique({
      where: { id: activeCompanyId }
    })
    if (company) return company
  }

  // Fallback to default company first, or first company
  let company = await prisma.company.findFirst({
    where: { isDefault: true }
  })

  if (!company) {
    company = await prisma.company.findFirst({
      orderBy: { createdAt: 'asc' }
    })
  }

  // If no company exists at all, create default
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Mi Empresa, SRL',
        rnc: '1-30-00000-0',
        phone: '809-555-0000',
        email: 'info@empresa.com.do',
        address: 'Santo Domingo, República Dominicana',
        slogan: '¡Gracias por su compra!',
        ncfB02Seq: 1,
        ncfB01Seq: 1,
        ncfB15Seq: 1,
        ncfExpiry: '31/12/2026',
        isDefault: true
      }
    })
  }

  return company
}

export async function getCompanies() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'asc' }
  })

  if (companies.length === 0) {
    const defaultCompany = await getActiveCompany()
    return [defaultCompany]
  }

  return companies
}

export async function switchCompany(companyId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_company_id', companyId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  })

  revalidatePath('/', 'layout')
}

export async function createCompany(formData: FormData) {
  const name = (formData.get('name') as string)?.trim() || 'Nueva Empresa'
  const rnc = (formData.get('rnc') as string)?.trim() || ''
  const phone = (formData.get('phone') as string)?.trim() || ''
  const email = (formData.get('email') as string)?.trim() || ''
  const address = (formData.get('address') as string)?.trim() || ''
  const slogan = (formData.get('slogan') as string)?.trim() || '¡Gracias por su compra!'
  const ncfExpiry = (formData.get('ncfExpiry') as string)?.trim() || '31/12/2026'

  const ncfB02Seq = parseInt(formData.get('ncfB02Seq') as string) || 1
  const ncfB01Seq = parseInt(formData.get('ncfB01Seq') as string) || 1
  const ncfB15Seq = parseInt(formData.get('ncfB15Seq') as string) || 1

  const newCompany = await prisma.company.create({
    data: {
      name,
      rnc,
      phone,
      email,
      address,
      slogan,
      ncfB02Seq,
      ncfB01Seq,
      ncfB15Seq,
      ncfExpiry
    }
  })

  const cookieStore = await cookies()
  cookieStore.set('active_company_id', newCompany.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })

  revalidatePath('/', 'layout')
  return newCompany.id
}

export async function updateActiveCompany(formData: FormData) {
  const active = await getActiveCompany()

  const name = (formData.get('name') as string)?.trim() || 'Mi Empresa'
  const rnc = (formData.get('rnc') as string)?.trim() || ''
  const phone = (formData.get('phone') as string)?.trim() || ''
  const email = (formData.get('email') as string)?.trim() || ''
  const address = (formData.get('address') as string)?.trim() || ''
  const slogan = (formData.get('slogan') as string)?.trim() || ''
  const ncfExpiry = (formData.get('ncfExpiry') as string)?.trim() || '31/12/2026'

  const ncfB02Seq = parseInt(formData.get('ncfB02Seq') as string) || 1
  const ncfB01Seq = parseInt(formData.get('ncfB01Seq') as string) || 1
  const ncfB15Seq = parseInt(formData.get('ncfB15Seq') as string) || 1

  await prisma.company.update({
    where: { id: active.id },
    data: {
      name,
      rnc,
      phone,
      email,
      address,
      slogan,
      ncfB02Seq,
      ncfB01Seq,
      ncfB15Seq,
      ncfExpiry
    }
  })

  revalidatePath('/', 'layout')
}

export async function deleteCompany(id: string) {
  const count = await prisma.company.count()
  if (count <= 1) {
    throw new Error("No puedes eliminar la única empresa activa del sistema.")
  }

  await prisma.company.delete({
    where: { id }
  })

  const remaining = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' }
  })

  if (remaining) {
    const cookieStore = await cookies()
    cookieStore.set('active_company_id', remaining.id, { path: '/' })
  }

  revalidatePath('/', 'layout')
}