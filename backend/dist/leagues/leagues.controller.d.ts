import { LeaguesService } from './leagues.service';
import { CreateLeagueDto, UpdateLeagueDto, AddMemberDto, CreateRuleDto, AssignPointsDto, JoinLeagueDto } from './dto/leagues.dto';
export declare class LeaguesController {
    private leaguesService;
    constructor(leaguesService: LeaguesService);
    createLeague(req: any, createLeagueDto: CreateLeagueDto): Promise<{
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        members: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            points: number;
            rank: number;
            joinedAt: Date;
            userId: string;
            leagueId: string;
        })[];
        rules: {
            id: string;
            description: string;
            createdAt: Date;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        admins: ({
            user: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            userId: string;
            leagueId: string;
            grantedAt: Date;
            grantedBy: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isPrivate: boolean;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        adminId: string;
    }>;
    getLeagues(req: any): Promise<({
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        members: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            points: number;
            rank: number;
            joinedAt: Date;
            userId: string;
            leagueId: string;
        })[];
        rules: {
            id: string;
            description: string;
            createdAt: Date;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        _count: {
            members: number;
            events: number;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        isPrivate: boolean;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        adminId: string;
    })[]>;
    getLeagueById(leagueId: string, req: any): Promise<{
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        members: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            points: number;
            rank: number;
            joinedAt: Date;
            userId: string;
            leagueId: string;
        })[];
        rules: {
            id: string;
            description: string;
            createdAt: Date;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        events: ({
            participants: ({
                user: {
                    id: string;
                    username: string;
                    avatar: string;
                };
            } & {
                id: string;
                points: number;
                rank: number;
                joinedAt: Date;
                userId: string;
                eventId: string;
            })[];
        } & {
            id: string;
            description: string | null;
            isPrivate: boolean;
            inviteCode: string | null;
            createdAt: Date;
            updatedAt: Date;
            adminId: string;
            leagueId: string | null;
            title: string;
            startDate: Date;
            endDate: Date;
            maxParticipants: number | null;
            hasScoring: boolean;
        })[];
        admins: ({
            user: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            userId: string;
            leagueId: string;
            grantedAt: Date;
            grantedBy: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isPrivate: boolean;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        adminId: string;
    }>;
    updateLeague(leagueId: string, req: any, updateLeagueDto: UpdateLeagueDto): Promise<{
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        members: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            points: number;
            rank: number;
            joinedAt: Date;
            userId: string;
            leagueId: string;
        })[];
        rules: {
            id: string;
            description: string;
            createdAt: Date;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        admins: ({
            user: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            userId: string;
            leagueId: string;
            grantedAt: Date;
            grantedBy: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isPrivate: boolean;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        adminId: string;
    }>;
    joinLeague(leagueId: string, req: any, joinLeagueDto: JoinLeagueDto): Promise<{
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        members: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            points: number;
            rank: number;
            joinedAt: Date;
            userId: string;
            leagueId: string;
        })[];
        rules: {
            id: string;
            description: string;
            createdAt: Date;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        events: ({
            participants: ({
                user: {
                    id: string;
                    username: string;
                    avatar: string;
                };
            } & {
                id: string;
                points: number;
                rank: number;
                joinedAt: Date;
                userId: string;
                eventId: string;
            })[];
        } & {
            id: string;
            description: string | null;
            isPrivate: boolean;
            inviteCode: string | null;
            createdAt: Date;
            updatedAt: Date;
            adminId: string;
            leagueId: string | null;
            title: string;
            startDate: Date;
            endDate: Date;
            maxParticipants: number | null;
            hasScoring: boolean;
        })[];
        admins: ({
            user: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            userId: string;
            leagueId: string;
            grantedAt: Date;
            grantedBy: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isPrivate: boolean;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        adminId: string;
    }>;
    leaveLeague(leagueId: string, req: any): Promise<{
        success: boolean;
    }>;
    addMember(leagueId: string, req: any, addMemberDto: AddMemberDto): Promise<{
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        members: ({
            user: {
                id: string;
                username: string;
                avatar: string;
                isOnline: boolean;
            };
        } & {
            id: string;
            points: number;
            rank: number;
            joinedAt: Date;
            userId: string;
            leagueId: string;
        })[];
        rules: {
            id: string;
            description: string;
            createdAt: Date;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        events: ({
            participants: ({
                user: {
                    id: string;
                    username: string;
                    avatar: string;
                };
            } & {
                id: string;
                points: number;
                rank: number;
                joinedAt: Date;
                userId: string;
                eventId: string;
            })[];
        } & {
            id: string;
            description: string | null;
            isPrivate: boolean;
            inviteCode: string | null;
            createdAt: Date;
            updatedAt: Date;
            adminId: string;
            leagueId: string | null;
            title: string;
            startDate: Date;
            endDate: Date;
            maxParticipants: number | null;
            hasScoring: boolean;
        })[];
        admins: ({
            user: {
                id: string;
                username: string;
                avatar: string;
            };
        } & {
            id: string;
            userId: string;
            leagueId: string;
            grantedAt: Date;
            grantedBy: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isPrivate: boolean;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        adminId: string;
    }>;
    getMembers(leagueId: string, req: any): Promise<{
        userId: string;
        username: string;
        avatar: string;
        isAdmin: any;
        joinedAt: any;
        totalPoints: number;
    }[]>;
    removeMember(leagueId: string, userId: string, req: any): Promise<{
        success: boolean;
    }>;
    grantAdminRights(leagueId: string, userId: string, req: any): Promise<{
        user: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        userId: string;
        leagueId: string;
        grantedAt: Date;
        grantedBy: string;
    }>;
    revokeAdminRights(leagueId: string, userId: string, req: any): Promise<{
        success: boolean;
    }>;
    createRule(leagueId: string, req: any, createRuleDto: CreateRuleDto): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }>;
    getRules(leagueId: string, req: any): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }[]>;
    assignPoints(leagueId: string, req: any, assignPointsDto: AssignPointsDto): Promise<{
        member: {
            id: string;
            points: number;
            rank: number;
            joinedAt: Date;
            userId: string;
            leagueId: string;
        };
        pointsAdded: number;
        category: import(".prisma/client").$Enums.PointCategory;
        reason: string;
    }>;
    getLeaderboard(leagueId: string): Promise<({
        user: {
            id: string;
            username: string;
            avatar: string;
            isOnline: boolean;
        };
    } & {
        id: string;
        points: number;
        rank: number;
        joinedAt: Date;
        userId: string;
        leagueId: string;
    })[]>;
}
