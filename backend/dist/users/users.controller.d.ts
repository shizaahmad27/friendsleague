import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    searchUsers(username: string): Promise<{
        id: string;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        avatar: string | null;
        inviteCode: string | null;
        isOnline: boolean;
        lastSeen: Date;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getUserFriends(req: any): Promise<{
        id: string;
        username: string;
        email: string | null;
        phoneNumber: string | null;
        avatar: string | null;
        inviteCode: string | null;
        isOnline: boolean;
        lastSeen: Date;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
