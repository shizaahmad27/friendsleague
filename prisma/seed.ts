import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default users
  console.log('👥 Creating default users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'alice',
        email: 'alice@friendsleague.com',
        phoneNumber: '+1234567890',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        inviteCode: 'ALICE123',
        isOnline: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'bob',
        email: 'bob@friendsleague.com',
        phoneNumber: '+1234567891',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
        inviteCode: 'BOB123',
        isOnline: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'charlie',
        email: 'charlie@friendsleague.com',
        phoneNumber: '+1234567892',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
        inviteCode: 'CHARLIE123',
        isOnline: false,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n🔑 Default login credentials:');
  console.log('Username: alice, bob, charlie');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });