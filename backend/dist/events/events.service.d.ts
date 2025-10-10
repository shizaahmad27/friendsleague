import { PrismaService } from '../common/prisma.service';
import { CreateEventDto, UpdateEventDto, AddParticipantDto, CreateEventRuleDto, AssignEventPointsDto, CreateEventInvitationDto } from './dto/events.dto';
export declare class EventsService {
    private prisma;
    constructor(prisma: PrismaService);
    createEvent(adminId: string, createEventDto: CreateEventDto): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            email: string | null;
            phoneNumber: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        title: string;
        adminId: string;
        leagueId: string | null;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    getEventParticipants(eventId: string, userId: string): Promise<({
        user: {
            username: string;
            id: string;
            avatar: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        userId: string;
        joinedAt: Date;
        points: number;
        rank: number;
        eventId: string;
    })[]>;
    getEventRules(eventId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        points: number;
        category: import(".prisma/client").$Enums.PointCategory;
        eventId: string;
    }[]>;
    getEvents(userId: string): Promise<({
        league: {
            name: string;
            id: string;
        };
        _count: {
            participants: number;
        };
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        title: string;
        adminId: string;
        leagueId: string | null;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    })[]>;
    getLeagueEvents(leagueId: string, userId: string): Promise<({
        _count: {
            participants: number;
        };
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        title: string;
        adminId: string;
        leagueId: string | null;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    })[]>;
    getEventById(eventId: string, userId: string): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            email: string | null;
            phoneNumber: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        title: string;
        adminId: string;
        leagueId: string | null;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    updateEvent(eventId: string, adminId: string, updateEventDto: UpdateEventDto): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            email: string | null;
            phoneNumber: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        title: string;
        adminId: string;
        leagueId: string | null;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    joinEvent(eventId: string, userId: string, inviteCode?: string): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            email: string | null;
            phoneNumber: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        title: string;
        adminId: string;
        leagueId: string | null;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    leaveEvent(eventId: string, userId: string): Promise<{
        success: boolean;
    }>;
    addParticipant(eventId: string, adminId: string, addParticipantDto: AddParticipantDto): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            email: string | null;
            phoneNumber: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        title: string;
        adminId: string;
        leagueId: string | null;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    removeParticipant(eventId: string, adminId: string, userId: string): Promise<{
        success: boolean;
    }>;
    createEventRule(eventId: string, adminId: string, createEventRuleDto: CreateEventRuleDto): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        points: number;
        category: import(".prisma/client").$Enums.PointCategory;
        eventId: string;
    }>;
    assignEventPoints(eventId: string, adminId: string, assignEventPointsDto: AssignEventPointsDto): Promise<{
        participant: {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        };
        pointsAdded: number;
        category: import(".prisma/client").$Enums.PointCategory;
        reason: string;
    }>;
    createEventInvitation(eventId: string, adminId: string, createEventInvitationDto: CreateEventInvitationDto): Promise<{
        email: string | null;
        phoneNumber: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        code: string;
        eventId: string;
        expiresAt: Date;
    }>;
    useEventInvitation(eventId: string, userId: string, code: string): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            email: string | null;
            phoneNumber: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
        participants: ({
            user: {
                username: string;
                id: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        title: string;
        adminId: string;
        leagueId: string | null;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    getEventLeaderboard(eventId: string): Promise<({
        user: {
            username: string;
            id: string;
            avatar: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        userId: string;
        joinedAt: Date;
        points: number;
        rank: number;
        eventId: string;
    })[]>;
    private verifyAdminAccess;
    private recalculateEventRankings;
    private updateLeaguePointsFromEvent;
    private recalculateLeagueRankings;
    private generateInviteCode;
}
