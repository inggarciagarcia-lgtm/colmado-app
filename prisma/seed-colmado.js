const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Semilla de Datos para Colmado Dominicano ---');

  // Asegurar o buscar SUPER COLMADO SAN RAFAEL
  let colmadoCompany = await prisma.company.findFirst({
    where: { name: { contains: 'SAN RAFAEL' } }
  });

  if (!colmadoCompany) {
    colmadoCompany = await prisma.company.create({
      data: {
        name: 'SUPER COLMADO SAN RAFAEL',
        rnc: '1-31-89745-2',
        phone: '809-555-2424',
        email: 'colmadosanrafael@gmail.com',
        address: 'Av. Las Palmas #45, Herrera, Santo Domingo Oeste',
        slogan: '¡Fresco, Frío y al Mejor Precio de la Zona!',
        ncfB02Seq: 100,
        ncfB01Seq: 10,
        ncfB15Seq: 1,
        ncfExpiry: '31/12/2026',
        isDefault: true
      }
    });
  } else {
    await prisma.company.updateMany({ data: { isDefault: false } });
    await prisma.company.update({
      where: { id: colmadoCompany.id },
      data: {
        isDefault: true,
        address: colmadoCompany.address || 'Av. Las Palmas #45, Herrera, Santo Domingo Oeste',
        phone: colmadoCompany.phone || '809-555-2424',
        slogan: '¡Fresco, Frío y al Mejor Precio de la Zona!'
      }
    });
  }

  const allCompanies = await prisma.company.findMany();

  const standardProducts = [
    // BEBIDAS
    { name: 'Cerveza Presidente Grande (Fría)', category: 'BEBIDAS', price: 180, stock: 120, unit: 'UNIDAD', returnable: true, isPopular: true, hasItbis: true, barcode: '7460123456789' },
    { name: 'Cerveza Presidente Pequeña', category: 'BEBIDAS', price: 125, stock: 96, unit: 'UNIDAD', returnable: true, isPopular: true, hasItbis: true, barcode: '7460123456790' },
    { name: 'Cerveza Presidente Light Grande', category: 'BEBIDAS', price: 180, stock: 72, unit: 'UNIDAD', returnable: true, isPopular: true, hasItbis: true },
    { name: 'Cerveza Bohemia Grande', category: 'BEBIDAS', price: 150, stock: 48, unit: 'UNIDAD', returnable: true, isPopular: true, hasItbis: true },
    { name: 'Botellón Agua 5 Galones (Planeta Azul)', category: 'BEBIDAS', price: 90, stock: 40, unit: 'UNIDAD', returnable: true, isPopular: true, hasItbis: false },
    { name: 'Funda de Hielo Entero', category: 'BEBIDAS', price: 50, stock: 60, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Coca-Cola 2 Litros', category: 'BEBIDAS', price: 110, stock: 36, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true, barcode: '7501055300075' },
    { name: 'Country Club Frambuesa 2L', category: 'BEBIDAS', price: 85, stock: 30, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true },
    { name: 'Jugo Rica Naranja 1L', category: 'BEBIDAS', price: 95, stock: 24, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Malta Morena Pequeña', category: 'BEBIDAS', price: 45, stock: 48, unit: 'UNIDAD', returnable: true, isPopular: true, hasItbis: true },
    { name: 'Ron Barceló Añejo (Chato)', category: 'BEBIDAS', price: 220, stock: 20, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true },
    { name: 'Ron Brugal Extra Viejo (Media)', category: 'BEBIDAS', price: 380, stock: 15, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true },

    // VIVERES Y PROVISIONES
    { name: 'Arroz Selecto Peñalba (Libra)', category: 'VIVERES', price: 45, stock: 250, unit: 'LIBRA', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Habichuelas Rojas (Libra)', category: 'VIVERES', price: 85, stock: 100, unit: 'LIBRA', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Aceite Crisol 16 oz', category: 'VIVERES', price: 95, stock: 50, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Azúcar Crema (Libra)', category: 'VIVERES', price: 35, stock: 120, unit: 'LIBRA', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Plátano Verde Grande (Unidad)', category: 'VIVERES', price: 25, stock: 150, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Huevos Frescos (Unidad)', category: 'VIVERES', price: 8, stock: 360, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Café Santo Domingo 1/2 Libra', category: 'VIVERES', price: 130, stock: 45, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Sopita Maggi (Sobre 2 und)', category: 'VIVERES', price: 20, stock: 200, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Leche Evaporada Carnation', category: 'VIVERES', price: 75, stock: 60, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },

    // EMBUTIDOS Y LÁCTEOS
    { name: 'Salami Induveca Especial (Libra)', category: 'EMBUTIDOS', price: 160, stock: 40, unit: 'LIBRA', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Queso Holandés / Geo (Libra)', category: 'EMBUTIDOS', price: 260, stock: 35, unit: 'LIBRA', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Queso Blanco de Freír (Libra)', category: 'EMBUTIDOS', price: 180, stock: 30, unit: 'LIBRA', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Jamón Cocido Caserío (Libra)', category: 'EMBUTIDOS', price: 210, stock: 25, unit: 'LIBRA', returnable: false, isPopular: true, hasItbis: false },

    // PANADERIA Y PICADERA
    { name: 'Pan de Agua / Sobao Fresco', category: 'PANADERIA', price: 10, stock: 100, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Galletas Hatuey (Paquete)', category: 'PANADERIA', price: 65, stock: 40, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: false },
    { name: 'Doritos Mediano', category: 'PANADERIA', price: 45, stock: 30, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true },

    // LIMPIEZA Y VARIOS
    { name: 'Cloro Macier 1/2 Galón', category: 'VARIOS', price: 60, stock: 30, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true },
    { name: 'Detergente Ace Pequeño', category: 'VARIOS', price: 45, stock: 40, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true },
    { name: 'Jabón Hispano de Cuaba', category: 'VARIOS', price: 40, stock: 50, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true },
    { name: 'Fósforos El Dragón', category: 'VARIOS', price: 10, stock: 100, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true },
    { name: 'Cigarrillo Nacional (Unidad)', category: 'VARIOS', price: 25, stock: 150, unit: 'UNIDAD', returnable: false, isPopular: true, hasItbis: true }
  ];

  for (const company of allCompanies) {
    // 1. Asegurar Consumidor Final
    let finalCustomer = await prisma.client.findFirst({
      where: { companyId: company.id, name: 'Consumidor Final' }
    });
    if (!finalCustomer) {
      await prisma.client.create({
        data: {
          companyId: company.id,
          name: 'Consumidor Final',
          nickname: 'Venta Rápida de Mostrador',
          creditLimit: 0,
          creditBalance: 0,
          phone: '',
          address: 'Mostrador'
        }
      });
    }

    // 2. Clientes de confianza para Fiao
    const sampleNeighbors = [
      { name: 'Carmen Rodríguez', nickname: 'Doña Carmen (Casa 14)', phone: '809-555-1234', address: 'Calle 3ra #14', creditLimit: 5000, creditBalance: 650, bottleDebt: '1 Grande' },
      { name: 'José Miguel Santos', nickname: 'El Moreno del 2B', phone: '829-555-5678', address: 'Edif. Las Palmas, Apto 2B', creditLimit: 3000, creditBalance: 420, bottleDebt: '2 Grandes' },
      { name: 'Manuel Pérez', nickname: 'Lic. Pérez', phone: '849-555-9012', address: 'Calle Principal #8', creditLimit: 10000, creditBalance: 1250, bottleDebt: 'Al día' }
    ];

    for (const neighbor of sampleNeighbors) {
      const exists = await prisma.client.findFirst({
        where: { companyId: company.id, name: neighbor.name }
      });
      if (!exists) {
        await prisma.client.create({
          data: {
            companyId: company.id,
            ...neighbor
          }
        });
      }
    }

    // 3. Crear o actualizar productos de colmado
    for (const prod of standardProducts) {
      const existing = await prisma.product.findFirst({
        where: { companyId: company.id, name: prod.name }
      });
      if (!existing) {
        await prisma.product.create({
          data: {
            companyId: company.id,
            ...prod
          }
        });
      } else {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            category: prod.category,
            unit: prod.unit,
            isPopular: prod.isPopular,
            returnable: prod.returnable,
            price: prod.price
          }
        });
      }
    }
  }

  console.log('✅ Base de datos de colmado sembrada con éxito.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
