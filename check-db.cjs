const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const items = await prisma.item.findMany();
  console.log('Items:', items);
}
run();
