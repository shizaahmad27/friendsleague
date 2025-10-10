import { PrismaService } from '../common/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from '@prisma/client';
type UserWithoutPassword = Omit<User, 'password'>;
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<UserWithoutPassword>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<UserWithoutPassword | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword>;
    updateOnlineStatus(id: string, isOnline: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    validatePassword(password: string, hashedPassword: string): Promise<boolean>;
    searchUsers(username: string): Promise<UserWithoutPassword[]>;
    getUserFriends(userId: string): Promise<UserWithoutPassword[]>;
    private generateInviteCode;
}
export {};
