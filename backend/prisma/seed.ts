import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - remove if you want to keep existing data)
  console.log('🧹 Clearing existing data...');
  await prisma.messageReadReceipt.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.eventInvitation.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.eventRule.deleteMany();
  await prisma.event.deleteMany();
  await prisma.leagueAdmin.deleteMany();
  await prisma.leagueMember.deleteMany();
  await prisma.leagueRule.deleteMany();
  await prisma.league.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();

  
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'shiza',
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
        username: 'aleks',
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
    prisma.user.create({
      data: {
        username: 'diana',
        email: 'diana@friendsleague.com',
        phoneNumber: '+1234567893',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
        inviteCode: 'DIANA123',
        isOnline: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'eve',
        email: 'eve@friendsleague.com',
        phoneNumber: '+1234567894',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
        inviteCode: 'EVE123',
        isOnline: false,
      },
    }),
  ]);


  const friendships = await Promise.all([
    // Alice is friends with Bob and Charlie
    prisma.friendship.create({
      data: {
        userId: users[0].id, // Alice
        friendId: users[1].id, // Bob
        status: 'ACCEPTED',
      },
    }),
    prisma.friendship.create({
      data: {
        userId: users[0].id, // Alice
        friendId: users[2].id, // Charlie
        status: 'ACCEPTED',
      },
    }),
    // Bob is friends with Diana
    prisma.friendship.create({
      data: {
        userId: users[1].id, // Bob
        friendId: users[3].id, // Diana
        status: 'ACCEPTED',
      },
    }),
    // Diana is friends with Eve
    prisma.friendship.create({
      data: {
        userId: users[3].id, // Diana
        friendId: users[4].id, // Eve
        status: 'ACCEPTED',
      },
    }),
  ]);

  
  const league = await prisma.league.create({
    data: {
      name: 'Gaming Champions',
      description: 'A league for competitive gamers',
      adminId: users[0].id, // Alice is the admin
      isPrivate: false,
      inviteCode: 'GAMING2024',
    },
  });

  // Add members to the league
  await Promise.all([
    prisma.leagueMember.create({
      data: {
        userId: users[0].id, // Alice
        leagueId: league.id,
        points: 150,
        rank: 1,
      },
    }),
    prisma.leagueMember.create({
      data: {
        userId: users[1].id, // Bob
        leagueId: league.id,
        points: 120,
        rank: 2,
      },
    }),
    prisma.leagueMember.create({
      data: {
        userId: users[2].id, // Charlie
        leagueId: league.id,
        points: 90,
        rank: 3,
      },
    }),
  ]);

  // Create league rules
  await Promise.all([
    prisma.leagueRule.create({
      data: {
        leagueId: league.id,
        title: 'Victory Points',
        description: 'Points awarded for winning games',
        points: 10,
        category: 'WINS',
      },
    }),
    prisma.leagueRule.create({
      data: {
        leagueId: league.id,
        title: 'Participation Bonus',
        description: 'Points for participating in events',
        points: 5,
        category: 'PARTICIPATION',
      },
    }),
  ]);

  
  const chat = await prisma.chat.create({
    data: {
      name: 'Gaming Squad',
      type: 'GROUP',
    },
  });

  // Add participants to the chat
  await Promise.all([
    prisma.chatParticipant.create({
      data: {
        chatId: chat.id,
        userId: users[0].id, // Alice
      },
    }),
    prisma.chatParticipant.create({
      data: {
        chatId: chat.id,
        userId: users[1].id, // Bob
      },
    }),
    prisma.chatParticipant.create({
      data: {
        chatId: chat.id,
        userId: users[2].id, // Charlie
      },
    }),
  ]);

  // Create some sample messages
  await Promise.all([
    prisma.message.create({
      data: {
        content: 'Hey everyone! Ready for the tournament?',
        type: 'TEXT',
        senderId: users[0].id, // Alice
        chatId: chat.id,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Absolutely! I\'ve been practicing all week',
        type: 'TEXT',
        senderId: users[1].id, // Bob
        chatId: chat.id,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Same here! Can\'t wait to see who wins',
        type: 'TEXT',
        senderId: users[2].id, // Charlie
        chatId: chat.id,
      },
    }),
  ]);

  
  
  const event = await prisma.event.create({
    data: {
      title: 'Weekly Gaming Tournament',
      description: 'Join us for our weekly competitive gaming tournament',
      leagueId: league.id,
      adminId: users[0].id, // Alice
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
      maxParticipants: 10,
      isPrivate: false,
      inviteCode: 'TOURNAMENT2024',
      hasScoring: true,
    },
  });

  // Add participants to the event
  await Promise.all([
    prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        userId: users[0].id, // Alice
        points: 0,
        rank: 0,
      },
    }),
    prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        userId: users[1].id, // Bob
        points: 0,
        rank: 0,
      },
    }),
    prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        userId: users[2].id, // Charlie
        points: 0,
        rank: 0,
      },
    }),
  ]);

}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
