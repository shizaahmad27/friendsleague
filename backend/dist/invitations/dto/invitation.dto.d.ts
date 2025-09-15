export declare class CreateInvitationDto {
    inviteeId: string;
}
export declare class UseInvitationDto {
    code: string;
}
export declare class InvitationResponseDto {
    id: string;
    code: string;
    inviterId: string;
    inviteeId?: string;
    status: string;
    expiredAt: Date;
    createdAt: Date;
    updatedAt: Date;
    inviter?: {
        id: string;
        username: string;
        avatar?: string;
    };
    invitee?: {
        id: string;
        username: string;
        avatar?: string;
    };
}
