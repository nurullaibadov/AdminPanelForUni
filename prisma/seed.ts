import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({})

async function main() {
  const hashedPassword = await bcrypt.hash('emilyspass', 10)
  const michaelPassword = await bcrypt.hash('michaelwpass', 10)

  await prisma.user.upsert({
    where: { email: 'emily.smith@x.dummyjson.com' },
    update: {},
    create: {
      name: 'Emily Smith',
      username: 'emilys',
      email: 'emily.smith@x.dummyjson.com',
      password: hashedPassword,
      role: 'admin',
      department: 'IT Administration',
      status: 'active',
      phone: '+1-555-0192',
    },
  })

  await prisma.user.upsert({
    where: { email: 'michael.williams@x.dummyjson.com' },
    update: {},
    create: {
      name: 'Michael Williams',
      username: 'michaelw',
      email: 'michael.williams@x.dummyjson.com',
      password: michaelPassword,
      role: 'operator',
      department: 'Network Operations',
      status: 'active',
      phone: '+1-555-0193',
    },
  })
  
  console.log('Seeded database with initial users')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
