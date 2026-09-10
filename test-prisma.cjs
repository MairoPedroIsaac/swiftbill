const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const businessProfile = await prisma.businessProfile.findFirst();
    if (!businessProfile) {
      console.log('No business profile');
      return;
    }
    
    // Simulate what PUT does
    const customerNameInput = "ren technologies and co".trim();
    let customer = await prisma.customer.findFirst({
        where: {
          businessProfileId: businessProfile.id,
          name: {
            equals: customerNameInput,
            mode: 'insensitive',
          },
        },
    });
    console.log('Customer found:', !!customer);

    const itm = { description: "Item 1", quantity: 1, rate: 100 };
    const itemDesc = (itm.description || "").trim();
    const parsedRate = parseFloat(itm.rate) || 0;
    const existingItem = await prisma.item.findFirst({
        where: { 
            businessProfileId: businessProfile.id, 
            name: {
            equals: itemDesc,
            mode: 'insensitive',
            },
        },
    });
    console.log('Item found:', !!existingItem);

    console.log('Success!');
  } catch(e) {
    console.error('PRISMA ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
