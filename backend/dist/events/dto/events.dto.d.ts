import { PointCategory } from '@prisma/client';
export declare class CreateEventDto {
    title: string;
    description?: string;
    leagueId?: string;
    startDate: string;
    endDate: string;
    maxParticipants?: number;
    isPrivate?: boolean;
    hasScoring?: boolean;
    participantIds?: string[];
}
export declare class UpdateEventDto {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    maxParticipants?: number;
    isPrivate?: boolean;
    hasScoring?: boolean;
}
export declare class AddParticipantDto {
    userId: string;
}
export declare class CreateEventRuleDto {
    title: string;
    description: string;
    points: number;
    category: PointCategory;
}
export declare class AssignEventPointsDto {
    userId: string;
    points: number;
    category: PointCategory;
    reason?: string;
}
export declare class JoinEventDto {
    inviteCode?: string;
}
export declare class CreateEventInvitationDto {
    email?: string;
    phoneNumber?: string;
    expiresInDays?: number;
}
