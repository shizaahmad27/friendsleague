import { PrismaService } from '../common/prisma.service';
import { CreateInvitationDto, UseInvitationDto, InvitationResponseDto } from './dto/invitation.dto';
export declare class InvitationsService {
    private prisma;
    constructor(prisma: PrismaService);
    createInvitation(userId: string, createInvitationDto: CreateInvitationDto): Promise<InvitationResponseDto>;
    getInvitations(userId: string): Promise<InvitationResponseDto[]>;
    useInvitation(userId: string, useInvitationDto: UseInvitationDto): Promise<{
        success: boolean;
        message: string;
        friendshipId?: string;
    }>;
    getMyInviteCode(userId: string): Promise<{
        code: string;
        username: string;
    }>;
    private generateInviteCode;
    private generateUserInviteCode;
    private mapToResponseDto;
}
