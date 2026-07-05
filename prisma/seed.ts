import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin', 10)

  // Upsert the admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  })
  console.log({ admin })

  // Ensure there's at least one profile record
  const profileCount = await prisma.profile.count()
  if (profileCount === 0) {
    const profile = await prisma.profile.create({
      data: {
        name: 'Your Name',
        designation: 'Frontend Developer',
        aboutMe: 'Write your story here.',
      },
    })
    console.log({ profile })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
