import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, AddParticipantDto, CreateEventRuleDto, AssignEventPointsDto, JoinEventDto, CreateEventInvitationDto } from './dto/events.dto';
export declare class EventsController {
    private eventsService;
    constructor(eventsService: EventsService);
    createEvent(req: any, createEventDto: CreateEventDto): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
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
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            id: string;
            username: string;
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
    getEvents(req: any): Promise<({
        league: {
            name: string;
            id: string;
        };
        _count: {
            participants: number;
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
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            id: string;
            username: string;
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
    getLeagueEvents(leagueId: string, req: any): Promise<({
        _count: {
            participants: number;
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
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            id: string;
            username: string;
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
    getEventById(eventId: string, req: any): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
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
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            id: string;
            username: string;
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
    updateEvent(eventId: string, req: any, updateEventDto: UpdateEventDto): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
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
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            id: string;
            username: string;
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
    joinEvent(eventId: string, req: any, joinEventDto: JoinEventDto): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
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
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            id: string;
            username: string;
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
    leaveEvent(eventId: string, req: any): Promise<{
        success: boolean;
    }>;
    addParticipant(eventId: string, req: any, addParticipantDto: AddParticipantDto): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
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
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            id: string;
            username: string;
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
        joinedAt: Date;
        points: number;
        rank: number;
        eventId: string;
    })[]>;
    removeParticipant(eventId: string, userId: string, req: any): Promise<{
        success: boolean;
    }>;
    createEventRule(eventId: string, req: any, createEventRuleDto: CreateEventRuleDto): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        points: number;
        category: import(".prisma/client").$Enums.PointCategory;
        eventId: string;
    }>;
    getEventRules(eventId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        points: number;
        category: import(".prisma/client").$Enums.PointCategory;
        eventId: string;
    }[]>;
    assignEventPoints(eventId: string, req: any, assignEventPointsDto: AssignEventPointsDto): Promise<{
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
    createEventInvitation(eventId: string, req: any, createEventInvitationDto: CreateEventInvitationDto): Promise<{
        id: string;
        email: string | null;
        phoneNumber: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        code: string;
        eventId: string;
        expiresAt: Date;
    }>;
    useEventInvitation(eventId: string, req: any, body: {
        code: string;
    }): Promise<{
        league: {
            name: string;
            id: string;
        };
        invitations: {
            id: string;
            email: string | null;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvitationStatus;
            code: string;
            eventId: string;
            expiresAt: Date;
        }[];
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
            joinedAt: Date;
            points: number;
            rank: number;
            eventId: string;
        })[];
        admin: {
            id: string;
            username: string;
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
            id: string;
            username: string;
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
}
