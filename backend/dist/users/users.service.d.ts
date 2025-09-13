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
    updateOnlineStatus(id: string, isOnline: boolean): Promise<void>;
    validatePassword(password: string, hashedPassword: string): Promise<boolean>;
}
export {};
