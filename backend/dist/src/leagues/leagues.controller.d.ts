import { LeaguesService } from './leagues.service';
import { CreateLeagueDto, UpdateLeagueDto, AddMemberDto, CreateRuleDto, UpdateRuleDto, AssignPointsDto, JoinLeagueDto } from './dto/leagues.dto';
export declare class LeaguesController {
    private leaguesService;
    constructor(leaguesService: LeaguesService);
    createLeague(req: any, createLeagueDto: CreateLeagueDto): Promise<{
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
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    }>;
    getLeagues(req: any): Promise<({
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
        _count: {
            events: number;
            members: number;
        };
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    })[]>;
    getLeagueById(leagueId: string, req: any): Promise<{
        events: ({
            participants: ({
                user: {
                    id: string;
                    username: string;
                    avatar: string;
                };
            } & {
                id: string;
                userId: string;
                points: number;
                rank: number;
                joinedAt: Date;
                eventId: string;
            })[];
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
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    }>;
    updateLeague(leagueId: string, req: any, updateLeagueDto: UpdateLeagueDto): Promise<{
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
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    }>;
    joinLeague(leagueId: string, req: any, joinLeagueDto: JoinLeagueDto): Promise<{
        events: ({
            participants: ({
                user: {
                    id: string;
                    username: string;
                    avatar: string;
                };
            } & {
                id: string;
                userId: string;
                points: number;
                rank: number;
                joinedAt: Date;
                eventId: string;
            })[];
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
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    }>;
    leaveLeague(leagueId: string, req: any): Promise<{
        success: boolean;
    }>;
    addMember(leagueId: string, req: any, addMemberDto: AddMemberDto): Promise<{
        events: ({
            participants: ({
                user: {
                    id: string;
                    username: string;
                    avatar: string;
                };
            } & {
                id: string;
                userId: string;
                points: number;
                rank: number;
                joinedAt: Date;
                eventId: string;
            })[];
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
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            points: number;
            leagueId: string;
            title: string;
            category: import(".prisma/client").$Enums.PointCategory;
        }[];
        admin: {
            id: string;
            username: string;
            avatar: string;
        };
    } & {
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    }>;
    getMembers(leagueId: string, req: any): Promise<{
        userId: string;
        username: string;
        avatar: string;
        isAdmin: boolean;
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
        createdAt: Date;
        description: string;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }>;
    getRules(leagueId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }[]>;
    updateRule(leagueId: string, ruleId: string, req: any, updateRuleDto: UpdateRuleDto): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }>;
    assignPoints(leagueId: string, req: any, assignPointsDto: AssignPointsDto): Promise<{
        member: {
            id: string;
            userId: string;
            points: number;
            rank: number;
            joinedAt: Date;
            leagueId: string;
        };
        pointsAdded: number;
        category: import(".prisma/client").$Enums.PointCategory;
        reason: string;
    }>;
    getLeaderboard(leagueId: string): Promise<{
        userId: string;
        username: string;
        avatar: string;
        totalPoints: number;
        rank: number;
    }[]>;
}
