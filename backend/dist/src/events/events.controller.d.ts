import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, AddParticipantDto, CreateEventRuleDto, AssignEventPointsDto, JoinEventDto, CreateEventInvitationDto } from './dto/events.dto';
export declare class EventsController {
    private eventsService;
    constructor(eventsService: EventsService);
    createEvent(req: any, createEventDto: CreateEventDto): Promise<{
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
    getEvents(req: any): Promise<({
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
    getLeagueEvents(leagueId: string, req: any): Promise<({
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
    getEventById(eventId: string, req: any): Promise<{
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
    updateEvent(eventId: string, req: any, updateEventDto: UpdateEventDto): Promise<{
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
    joinEvent(eventId: string, req: any, joinEventDto: JoinEventDto): Promise<{
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
    leaveEvent(eventId: string, req: any): Promise<{
        success: boolean;
    }>;
    addParticipant(eventId: string, req: any, addParticipantDto: AddParticipantDto): Promise<{
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
    getParticipants(eventId: string, req: any): Promise<({
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
    removeParticipant(eventId: string, userId: string, req: any): Promise<{
        success: boolean;
    }>;
    createEventRule(eventId: string, req: any, createEventRuleDto: CreateEventRuleDto): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        points: number;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
        eventId: string;
    }>;
    getEventRules(eventId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        points: number;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
        eventId: string;
    }[]>;
    assignEventPoints(eventId: string, req: any, assignEventPointsDto: AssignEventPointsDto): Promise<{
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
    createEventInvitation(eventId: string, req: any, createEventInvitationDto: CreateEventInvitationDto): Promise<{
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
    useEventInvitation(eventId: string, req: any, body: {
        code: string;
    }): Promise<{
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
}
