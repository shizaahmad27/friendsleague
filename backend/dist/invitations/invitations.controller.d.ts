import { InvitationsService } from './invitations.service';
import { CreateInvitationDto, UseInvitationDto } from './dto/invitation.dto';
export declare class InvitationsController {
    private invitationsService;
    constructor(invitationsService: InvitationsService);
    createInvitation(req: any, createInvitationDto: CreateInvitationDto): Promise<import("./dto/invitation.dto").InvitationResponseDto>;
    getInvitations(req: any): Promise<import("./dto/invitation.dto").InvitationResponseDto[]>;
    useInvitation(req: any, useInvitationDto: UseInvitationDto): Promise<{
        success: boolean;
        message: string;
        friendshipId?: string;
    }>;
    getMyInviteCode(req: any): Promise<{
        code: string;
        username: string;
    }>;
}
