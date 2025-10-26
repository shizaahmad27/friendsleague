import { PrismaService } from '../common/prisma.service';
import { CreateEventDto, UpdateEventDto, AddParticipantDto, CreateEventRuleDto, AssignEventPointsDto, CreateEventInvitationDto } from './dto/events.dto';
export declare class EventsService {
    private prisma;
    constructor(prisma: PrismaService);
    createEvent(adminId: string, createEventDto: CreateEventDto): Promise<{
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        league: {
            id: string;
            name: string;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            eventId: string;
        })[];
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            eventId: string;
            code: string;
            expiresAt: Date;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
        leagueId: string | null;
        title: string;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    getEventParticipants(eventId: string, userId: string): Promise<({
        user: {
            id: string;
            username: string;
            avatar: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        userId: string;
        points: number;
        rank: number;
        joinedAt: Date;
        eventId: string;
    })[]>;
    getEventRules(eventId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        points: number;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
        eventId: string;
    }[]>;
    getEvents(userId: string): Promise<({
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        league: {
            id: string;
            name: string;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            eventId: string;
        })[];
        _count: {
            participants: number;
        };
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
        leagueId: string | null;
        title: string;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    })[]>;
    getLeagueEvents(leagueId: string, userId: string): Promise<({
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            eventId: string;
        })[];
        _count: {
            participants: number;
        };
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
        leagueId: string | null;
        title: string;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    })[]>;
    getEventById(eventId: string, userId: string): Promise<{
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        league: {
            id: string;
            name: string;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            eventId: string;
        })[];
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            eventId: string;
            code: string;
            expiresAt: Date;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
        leagueId: string | null;
        title: string;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    updateEvent(eventId: string, adminId: string, updateEventDto: UpdateEventDto): Promise<{
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        league: {
            id: string;
            name: string;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            eventId: string;
        })[];
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            eventId: string;
            code: string;
            expiresAt: Date;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
        leagueId: string | null;
        title: string;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    joinEvent(eventId: string, userId: string, inviteCode?: string): Promise<{
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        league: {
            id: string;
            name: string;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            eventId: string;
        })[];
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            eventId: string;
            code: string;
            expiresAt: Date;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
        leagueId: string | null;
        title: string;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    leaveEvent(eventId: string, userId: string): Promise<{
        success: boolean;
    }>;
    addParticipant(eventId: string, adminId: string, addParticipantDto: AddParticipantDto): Promise<{
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        league: {
            id: string;
            name: string;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            eventId: string;
        })[];
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            eventId: string;
            code: string;
            expiresAt: Date;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
        leagueId: string | null;
        title: string;
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
        points: number;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
        eventId: string;
    }>;
    assignEventPoints(eventId: string, adminId: string, assignEventPointsDto: AssignEventPointsDto): Promise<{
        participant: {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            eventId: string;
        };
        pointsAdded: number;
        category: import(".prisma/client").$Enums.PointCategory;
        reason: string;
    }>;
    createEventInvitation(eventId: string, adminId: string, createEventInvitationDto: CreateEventInvitationDto): Promise<{
        id: string;
        email: string | null;
        phoneNumber: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        eventId: string;
        code: string;
        expiresAt: Date;
    }>;
    useEventInvitation(eventId: string, userId: string, code: string): Promise<{
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
            eventId: string;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        league: {
            id: string;
            name: string;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            eventId: string;
        })[];
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            eventId: string;
            code: string;
            expiresAt: Date;
        }[];
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
        leagueId: string | null;
        title: string;
        startDate: Date;
        endDate: Date;
        maxParticipants: number | null;
        hasScoring: boolean;
    }>;
    getEventLeaderboard(eventId: string): Promise<({
        user: {
            id: string;
            username: string;
            avatar: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        userId: string;
        points: number;
        rank: number;
        joinedAt: Date;
        eventId: string;
    })[]>;
    private verifyAdminAccess;
    private recalculateEventRankings;
    private updateLeaguePointsFromEvent;
    private recalculateLeagueRankings;
    private generateInviteCode;
}
