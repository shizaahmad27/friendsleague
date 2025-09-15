import { InvitationService, InvitationWithUsers } from './invitation.service';
export declare class InvitationController {
    private invitationService;
    constructor(invitationService: InvitationService);
    createInvitation(req: any, body: {
        inviteeId: string;
    }): Promise<InvitationWithUsers>;
    getInvitations(req: any): Promise<InvitationWithUsers[]>;
    getPendingInvitations(req: any): Promise<InvitationWithUsers[]>;
    acceptInvitation(req: any, invitationId: string): Promise<InvitationWithUsers>;
    rejectInvitation(req: any, invitationId: string): Promise<InvitationWithUsers>;
    cancelInvitation(req: any, invitationId: string): Promise<InvitationWithUsers>;
    useInviteCode(req: any, body: {
        code: string;
    }): Promise<{
        success: boolean;
        message: string;
        friendshipId?: string;
    }>;
    getMyInviteCode(req: any): Promise<{
        code: string;
        username: string;
    }>;
}
