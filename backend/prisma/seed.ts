import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  
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
    prisma.user.create({
      data: {
        username: 'frank',
        email: 'frank@friendsleague.com',
        phoneNumber: '+1234567895',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank',
        inviteCode: 'FRANK123',
        isOnline: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'grace',
        email: 'grace@friendsleague.com',
        phoneNumber: '+1234567896',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace',
        inviteCode: 'GRACE123',
        isOnline: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'henry',
        email: 'henry@friendsleague.com',
        phoneNumber: '+1234567897',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry',
        inviteCode: 'HENRY123',
        isOnline: false,
      },
    }),
    prisma.user.create({
      data: {
        username: 'ivy',
        email: 'ivy@friendsleague.com',
        phoneNumber: '+1234567898',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivy',
        inviteCode: 'IVY123',
        isOnline: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'jack',
        email: 'jack@friendsleague.com',
        phoneNumber: '+1234567899',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jack',
        inviteCode: 'JACK123',
        isOnline: false,
      },
    }),
    prisma.user.create({
      data: {
        username: 'kate',
        email: 'kate@friendsleague.com',
        phoneNumber: '+1234567900',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kate',
        inviteCode: 'KATE123',
        isOnline: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'liam',
        email: 'liam@friendsleague.com',
        phoneNumber: '+1234567901',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liam',
        inviteCode: 'LIAM123',
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
    // Bob is also friends with Frank (mutual friend with Alice through Bob)
    prisma.friendship.create({
      data: {
        userId: users[1].id, // Bob
        friendId: users[5].id, // Frank
        status: 'ACCEPTED',
      },
    }),
    // Charlie is friends with Grace
    prisma.friendship.create({
      data: {
        userId: users[2].id, // Charlie
        friendId: users[6].id, // Grace
        status: 'ACCEPTED',
      },
    }),
    // Diana is friends with Henry
    prisma.friendship.create({
      data: {
        userId: users[3].id, // Diana
        friendId: users[7].id, // Henry
        status: 'ACCEPTED',
      },
    }),
    // Eve is friends with Ivy
    prisma.friendship.create({
      data: {
        userId: users[4].id, // Eve
        friendId: users[8].id, // Ivy
        status: 'ACCEPTED',
      },
    }),
    // Frank is friends with Jack
    prisma.friendship.create({
      data: {
        userId: users[5].id, // Frank
        friendId: users[9].id, // Jack
        status: 'ACCEPTED',
      },
    }),
    // Grace is friends with Kate
    prisma.friendship.create({
      data: {
        userId: users[6].id, // Grace
        friendId: users[10].id, // Kate
        status: 'ACCEPTED',
      },
    }),
    // Henry is friends with Liam
    prisma.friendship.create({
      data: {
        userId: users[7].id, // Henry
        friendId: users[11].id, // Liam
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
