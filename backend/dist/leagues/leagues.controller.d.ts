import { LeaguesService } from './leagues.service';
import { CreateLeagueDto, UpdateLeagueDto, AddMemberDto, CreateRuleDto, UpdateRuleDto, AssignPointsDto, JoinLeagueDto } from './dto/leagues.dto';
export declare class LeaguesController {
    private leaguesService;
    constructor(leaguesService: LeaguesService);
    createLeague(req: any, createLeagueDto: CreateLeagueDto): Promise<{
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            leagueId: string;
        }[];
        admins: ({
            user: {
                username: string;
                id: string;
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
        name: string;
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    }>;
    getLeagues(req: any): Promise<({
        _count: {
            members: number;
            events: number;
        };
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            leagueId: string;
        }[];
    } & {
        name: string;
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    })[]>;
    getLeagueById(leagueId: string, req: any): Promise<{
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            leagueId: string;
        }[];
        events: ({
            participants: ({
                user: {
                    username: string;
                    id: string;
                    avatar: string;
                };
            } & {
                id: string;
                userId: string;
                joinedAt: Date;
                points: number;
                rank: number;
                eventId: string;
            })[];
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
        })[];
        admins: ({
            user: {
                username: string;
                id: string;
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
        name: string;
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    }>;
    updateLeague(leagueId: string, req: any, updateLeagueDto: UpdateLeagueDto): Promise<{
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            leagueId: string;
        }[];
        admins: ({
            user: {
                username: string;
                id: string;
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
        name: string;
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    }>;
    joinLeague(leagueId: string, req: any, joinLeagueDto: JoinLeagueDto): Promise<{
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            leagueId: string;
        }[];
        events: ({
            participants: ({
                user: {
                    username: string;
                    id: string;
                    avatar: string;
                };
            } & {
                id: string;
                userId: string;
                joinedAt: Date;
                points: number;
                rank: number;
                eventId: string;
            })[];
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
        })[];
        admins: ({
            user: {
                username: string;
                id: string;
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
        name: string;
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrivate: boolean;
        adminId: string;
    }>;
    leaveLeague(leagueId: string, req: any): Promise<{
        success: boolean;
    }>;
    addMember(leagueId: string, req: any, addMemberDto: AddMemberDto): Promise<{
        admin: {
            username: string;
            id: string;
            avatar: string;
        };
        members: ({
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
            leagueId: string;
        })[];
        rules: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            points: number;
            category: import(".prisma/client").$Enums.PointCategory;
            leagueId: string;
        }[];
        events: ({
            participants: ({
                user: {
                    username: string;
                    id: string;
                    avatar: string;
                };
            } & {
                id: string;
                userId: string;
                joinedAt: Date;
                points: number;
                rank: number;
                eventId: string;
            })[];
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
        })[];
        admins: ({
            user: {
                username: string;
                id: string;
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
        name: string;
        id: string;
        inviteCode: string | null;
        createdAt: Date;
        updatedAt: Date;
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
            username: string;
            id: string;
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
        title: string;
        points: number;
        category: import(".prisma/client").$Enums.PointCategory;
        leagueId: string;
    }>;
    getRules(leagueId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        points: number;
        category: import(".prisma/client").$Enums.PointCategory;
        leagueId: string;
    }[]>;
    updateRule(leagueId: string, ruleId: string, req: any, updateRuleDto: UpdateRuleDto): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        title: string;
        points: number;
        category: import(".prisma/client").$Enums.PointCategory;
        leagueId: string;
    }>;
    assignPoints(leagueId: string, req: any, assignPointsDto: AssignPointsDto): Promise<{
        member: {
            id: string;
            userId: string;
            joinedAt: Date;
            points: number;
            rank: number;
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
