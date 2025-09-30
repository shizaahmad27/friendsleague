import { PointCategory } from '@prisma/client';
export declare class CreateLeagueDto {
    name: string;
    description?: string;
    isPrivate?: boolean;
}
export declare class UpdateLeagueDto {
    name?: string;
    description?: string;
    isPrivate?: boolean;
}
export declare class AddMemberDto {
    userId: string;
}
export declare class CreateRuleDto {
    title: string;
    description: string;
    points: number;
    category: PointCategory;
}
export declare class AssignPointsDto {
    userId: string;
    points: number;
    category: PointCategory;
    reason?: string;
}
export declare class JoinLeagueDto {
    inviteCode?: string;
}
