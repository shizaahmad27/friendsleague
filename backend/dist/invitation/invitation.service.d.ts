import { PrismaService } from '../common/prisma.service';
import { Invitation, User } from '@prisma/client';
export type InvitationWithUsers = Invitation & {
    inviter: User;
    invitee: User | null;
};
export declare class InvitationService {
    private prisma;
    constructor(prisma: PrismaService);
    createInvitation(inviterId: string, inviteeId: string): Promise<InvitationWithUsers>;
    getInvitations(userId: string): Promise<InvitationWithUsers[]>;
    getPendingInvitations(userId: string): Promise<InvitationWithUsers[]>;
    acceptInvitation(invitationId: string, userId: string): Promise<InvitationWithUsers>;
    rejectInvitation(invitationId: string, userId: string): Promise<InvitationWithUsers>;
    cancelInvitation(invitationId: string, userId: string): Promise<InvitationWithUsers>;
    useInviteCode(userId: string, code: string): Promise<{
        success: boolean;
        message: string;
        invitationId?: string;
    }>;
    getMyInviteCode(userId: string): Promise<{
        code: string;
        username: string;
    }>;
    private generateSecureInviteCode;
}
