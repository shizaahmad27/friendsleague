import { PrismaService } from '../common/prisma.service';
import { CreateLeagueDto, UpdateLeagueDto, AddMemberDto, CreateRuleDto, AssignPointsDto, UpdateRuleDto } from './dto/leagues.dto';
export declare class LeaguesService {
    private prisma;
    constructor(prisma: PrismaService);
    createLeague(adminId: string, createLeagueDto: CreateLeagueDto): Promise<{
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
    getLeagues(userId: string): Promise<({
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
    getLeagueById(leagueId: string, userId: string): Promise<{
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
    updateLeague(leagueId: string, adminId: string, updateLeagueDto: UpdateLeagueDto): Promise<{
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
    joinLeague(leagueId: string, userId: string, inviteCode?: string): Promise<{
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
    leaveLeague(leagueId: string, userId: string): Promise<{
        success: boolean;
    }>;
    addMember(leagueId: string, adminId: string, addMemberDto: AddMemberDto): Promise<{
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
    getMembers(leagueId: string, requesterId: string): Promise<{
        userId: string;
        username: string;
        avatar: string;
        isAdmin: boolean;
        joinedAt: any;
        totalPoints: number;
    }[]>;
    removeMember(leagueId: string, adminId: string, userId: string): Promise<{
        success: boolean;
    }>;
    grantAdminRights(leagueId: string, adminId: string, userId: string): Promise<{
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
    revokeAdminRights(leagueId: string, adminId: string, userId: string): Promise<{
        success: boolean;
    }>;
    createRule(leagueId: string, adminId: string, createRuleDto: CreateRuleDto): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }>;
    getRules(leagueId: string, requesterId: string): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }[]>;
    updateRule(leagueId: string, adminId: string, ruleId: string, updateRuleDto: UpdateRuleDto): Promise<{
        id: string;
        description: string;
        createdAt: Date;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }>;
    assignPoints(leagueId: string, adminId: string, assignPointsDto: AssignPointsDto): Promise<{
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
    private verifyAdminAccess;
    private recalculateRankings;
    private generateInviteCode;
}
