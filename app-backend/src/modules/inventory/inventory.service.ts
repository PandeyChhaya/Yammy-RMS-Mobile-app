import prisma from '../../db.js'

export const createIngredient = async (body: any) => {
  const { name, description, category, unit, min_stock, max_stock,
          cost_per_unit, supplier_id, barcode, image_url, expiration_date } = body

  const exists = await prisma.ingredients.findFirst({ where: { name } })
  if (exists) throw new Error('Ingredient already exists')

  const ingredient = await prisma.ingredients.create({
    data: {
      name, description, category, unit,
      min_stock, max_stock, cost_per_unit,
      supplier_id: supplier_id || null,
      barcode, image_url,
      expiration_date: expiration_date ? new Date(expiration_date) : null,
    },
  })

  await checkAndCreateAlerts(ingredient.id)
  return ingredient
}

export const getAllIngredients = async () => {
  return prisma.ingredients.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  })
}

export const getIngredientById = async (id: string) => {
  const ingredient = await prisma.ingredients.findUnique({ where: { id } })
  if (!ingredient) throw new Error('Ingredient not found')
  return ingredient
}

export const updateIngredient = async (id: string, body: any) => {
  const exists = await prisma.ingredients.findUnique({ where: { id } })
  if (!exists) throw new Error('Ingredient not found')

  const oldStock = Number(exists.current_stock)
  const newStock = body.current_stock !== undefined ? Number(body.current_stock) : undefined

  const updated = await prisma.ingredients.update({
    where: { id },
    data: {
      ...body,
      expiration_date: body.expiration_date ? new Date(body.expiration_date) : undefined,
      updated_at: new Date(),
    },
  })

  if (newStock !== undefined && newStock !== oldStock) {
    const diff = newStock - oldStock
    await prisma.stock_movements.create({
      data: {
        ingredient_id: id,
        movement_type: diff > 0 ? 'in' : 'adjustment',
        quantity: Math.abs(diff),
        unit: updated.unit,
        reason: 'Manual stock update',
      },
    })
  }

  await checkAndCreateAlerts(id)
  return updated
}

export const deleteIngredient = async (id: string) => {
  const exists = await prisma.ingredients.findUnique({ where: { id } })
  if (!exists) throw new Error('Ingredient not found')
  await prisma.ingredients.update({
    where: { id },
    data: { is_active: false },
  })
  return { message: 'Ingredient deleted successfully' }
}

export const createSupplier = async (body: any) => {
  return prisma.suppliers.create({ data: body })
}

export const getAllSuppliers = async () => {
  return prisma.suppliers.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  })
}

export const getSupplierById = async (id: string) => {
  const supplier = await prisma.suppliers.findUnique({ where: { id } })
  if (!supplier) throw new Error('Supplier not found')
  return supplier
}

export const updateSupplier = async (id: string, body: any) => {
  const exists = await prisma.suppliers.findUnique({ where: { id } })
  if (!exists) throw new Error('Supplier not found')
  return prisma.suppliers.update({ where: { id }, data: { ...body, updated_at: new Date() } })
}

export const deleteSupplier = async (id: string) => {
  const exists = await prisma.suppliers.findUnique({ where: { id } })
  if (!exists) throw new Error('Supplier not found')
  await prisma.suppliers.update({ where: { id }, data: { is_active: false } })
  return { message: 'Supplier deleted successfully' }
}

export const getAllInvoices = async () => {
  return prisma.invoices.findMany({
    include: { items: true },
    orderBy: { created_at: 'desc' },
  })
}

export const getInvoiceById = async (id: string) => {
  const invoice = await prisma.invoices.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!invoice) throw new Error('Invoice not found')
  return invoice
}

export const getInvoiceItems = async (invoice_id: string) => {
  return prisma.invoice_items.findMany({ where: { invoice_id } })
}

export const deleteInvoice = async (id: string) => {
  const exists = await prisma.invoices.findUnique({ where: { id } })
  if (!exists) throw new Error('Invoice not found')
  await prisma.invoices.delete({ where: { id } })
  return { message: 'Invoice deleted successfully' }
}

export const getStockMovements = async (ingredient_id?: string) => {
  return prisma.stock_movements.findMany({
    where: ingredient_id ? { ingredient_id } : undefined,
    orderBy: { created_at: 'desc' },
    take: 100,
  })
}

export const getStockAlerts = async () => {
  return prisma.stock_alerts.findMany({
    where: { is_read: false },
    orderBy: { created_at: 'desc' },
  })
}

export const markAlertAsRead = async (alert_id: string) => {
  const exists = await prisma.stock_alerts.findUnique({ where: { id: alert_id } })
  if (!exists) throw new Error('Alert not found')
  await prisma.stock_alerts.update({ where: { id: alert_id }, data: { is_read: true } })
  return { message: 'Alert marked as read' }
}

export const getDashboardData = async () => {
  const [ingredients, alerts, recentMovements] = await Promise.all([
    prisma.ingredients.findMany({ where: { is_active: true } }),
    prisma.stock_alerts.findMany({ where: { is_read: false }, orderBy: { created_at: 'desc' } }),
    prisma.stock_movements.findMany({ orderBy: { created_at: 'desc' }, take: 10 }),
  ])

  const lowStockCount    = ingredients.filter(i => Number(i.current_stock) <= Number(i.min_stock) && Number(i.current_stock) > 0).length
  const outOfStockCount  = ingredients.filter(i => Number(i.current_stock) <= 0).length
  const expiringSoonCount = ingredients.filter(i => {
    if (!i.expiration_date) return false
    const days = (new Date(i.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days <= 7 && days >= 0
  }).length
  const totalValue = ingredients.reduce((sum, i) => sum + Number(i.current_stock) * Number(i.cost_per_unit), 0)

  return {
    totalIngredients: ingredients.length,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
    totalValue,
    recentMovements,
    alerts,
  }
}

const checkAndCreateAlerts = async (ingredient_id: string) => {
  const ingredient = await prisma.ingredients.findUnique({ where: { id: ingredient_id } })
  if (!ingredient) return

  const current = Number(ingredient.current_stock)
  const min     = Number(ingredient.min_stock)

  await prisma.stock_alerts.deleteMany({ where: { ingredient_id, is_read: false } })

  if (current <= 0) {
    await prisma.stock_alerts.create({
      data: {
        ingredient_id,
        alert_type: 'out_of_stock',
        message: `${ingredient.name} is out of stock`,
      },
    })
  } else if (current <= min) {
    await prisma.stock_alerts.create({
      data: {
        ingredient_id,
        alert_type: 'low_stock',
        message: `${ingredient.name} is running low (${current} ${ingredient.unit} remaining)`,
      },
    })
  }

  if (ingredient.expiration_date) {
    const days = (new Date(ingredient.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (days < 0) {
      await prisma.stock_alerts.create({
        data: { ingredient_id, alert_type: 'expired', message: `${ingredient.name} has expired` },
      })
    } else if (days <= 7) {
      await prisma.stock_alerts.create({
        data: { ingredient_id, alert_type: 'expiring_soon', message: `${ingredient.name} expires in ${Math.ceil(days)} day(s)` },
      })
    }
  }
}