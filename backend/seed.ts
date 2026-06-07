import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  console.log('Ensuring default user exists...');
  
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: 'anisensei_user'
      }
    });
    console.log('Created default user:', user.username);
  } else {
    console.log('Default user already exists:', user.username);
  }

  console.log('Setup complete!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
