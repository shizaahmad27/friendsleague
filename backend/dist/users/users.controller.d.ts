import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    searchUsers(username: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        avatar: string | null;
        inviteCode: string | null;
        isOnline: boolean;
        lastSeen: Date;
    }[]>;
    getUserFriends(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        avatar: string | null;
        inviteCode: string | null;
        isOnline: boolean;
        lastSeen: Date;
    }[]>;
    updateOnlineStatus(req: any, body: {
        isOnline: boolean;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
