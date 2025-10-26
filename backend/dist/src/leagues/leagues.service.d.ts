import { PrismaService } from '../common/prisma.service';
import { CreateLeagueDto, UpdateLeagueDto, AddMemberDto, CreateRuleDto, AssignPointsDto, UpdateRuleDto } from './dto/leagues.dto';
export declare class LeaguesService {
    private prisma;
    constructor(prisma: PrismaService);
    createLeague(adminId: string, createLeagueDto: CreateLeagueDto): Promise<{
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
    getLeagues(userId: string): Promise<({
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
    getLeagueById(leagueId: string, userId: string): Promise<{
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
    updateLeague(leagueId: string, adminId: string, updateLeagueDto: UpdateLeagueDto): Promise<{
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
    joinLeague(leagueId: string, userId: string, inviteCode?: string): Promise<{
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
    leaveLeague(leagueId: string, userId: string): Promise<{
        success: boolean;
    }>;
    addMember(leagueId: string, adminId: string, addMemberDto: AddMemberDto): Promise<{
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
        createdAt: Date;
        description: string;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }>;
    getRules(leagueId: string, requesterId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }[]>;
    updateRule(leagueId: string, adminId: string, ruleId: string, updateRuleDto: UpdateRuleDto): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        points: number;
        leagueId: string;
        title: string;
        category: import(".prisma/client").$Enums.PointCategory;
    }>;
    assignPoints(leagueId: string, adminId: string, assignPointsDto: AssignPointsDto): Promise<{
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
    private verifyAdminAccess;
    private recalculateRankings;
    private generateInviteCode;
}
