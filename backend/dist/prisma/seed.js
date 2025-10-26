"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
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
    ]);
    const friendships = await Promise.all([
        prisma.friendship.create({
            data: {
                userId: users[0].id,
                friendId: users[1].id,
                status: 'ACCEPTED',
            },
        }),
        prisma.friendship.create({
            data: {
                userId: users[0].id,
                friendId: users[2].id,
                status: 'ACCEPTED',
            },
        }),
        prisma.friendship.create({
            data: {
                userId: users[1].id,
                friendId: users[3].id,
                status: 'ACCEPTED',
            },
        }),
        prisma.friendship.create({
            data: {
                userId: users[3].id,
                friendId: users[4].id,
                status: 'ACCEPTED',
            },
        }),
    ]);
    const league = await prisma.league.create({
        data: {
            name: 'Gaming Champions',
            description: 'A league for competitive gamers',
            adminId: users[0].id,
            isPrivate: false,
            inviteCode: 'GAMING2024',
        },
    });
    await Promise.all([
        prisma.leagueMember.create({
            data: {
                userId: users[0].id,
                leagueId: league.id,
                points: 150,
                rank: 1,
            },
        }),
        prisma.leagueMember.create({
            data: {
                userId: users[1].id,
                leagueId: league.id,
                points: 120,
                rank: 2,
            },
        }),
        prisma.leagueMember.create({
            data: {
                userId: users[2].id,
                leagueId: league.id,
                points: 90,
                rank: 3,
            },
        }),
    ]);
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
    await Promise.all([
        prisma.chatParticipant.create({
            data: {
                chatId: chat.id,
                userId: users[0].id,
            },
        }),
        prisma.chatParticipant.create({
            data: {
                chatId: chat.id,
                userId: users[1].id,
            },
        }),
        prisma.chatParticipant.create({
            data: {
                chatId: chat.id,
                userId: users[2].id,
            },
        }),
    ]);
    await Promise.all([
        prisma.message.create({
            data: {
                content: 'Hey everyone! Ready for the tournament?',
                type: 'TEXT',
                senderId: users[0].id,
                chatId: chat.id,
            },
        }),
        prisma.message.create({
            data: {
                content: 'Absolutely! I\'ve been practicing all week',
                type: 'TEXT',
                senderId: users[1].id,
                chatId: chat.id,
            },
        }),
        prisma.message.create({
            data: {
                content: 'Same here! Can\'t wait to see who wins',
                type: 'TEXT',
                senderId: users[2].id,
                chatId: chat.id,
            },
        }),
    ]);
    const event = await prisma.event.create({
        data: {
            title: 'Weekly Gaming Tournament',
            description: 'Join us for our weekly competitive gaming tournament',
            leagueId: league.id,
            adminId: users[0].id,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            maxParticipants: 10,
            isPrivate: false,
            inviteCode: 'TOURNAMENT2024',
            hasScoring: true,
        },
    });
    await Promise.all([
        prisma.eventParticipant.create({
            data: {
                eventId: event.id,
                userId: users[0].id,
                points: 0,
                rank: 0,
            },
        }),
        prisma.eventParticipant.create({
            data: {
                eventId: event.id,
                userId: users[1].id,
                points: 0,
                rank: 0,
            },
        }),
        prisma.eventParticipant.create({
            data: {
                eventId: event.id,
                userId: users[2].id,
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
//# sourceMappingURL=seed.js.map