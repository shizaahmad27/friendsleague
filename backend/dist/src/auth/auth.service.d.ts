import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignUpDto, SignInDto, RefreshTokenDto } from './dto/auth.dto';
import { User } from '@prisma/client';
export interface AuthResponse {
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    signUp(signUpDto: SignUpDto): Promise<AuthResponse>;
    signIn(signInDto: SignInDto): Promise<AuthResponse>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
    }>;
    logout(userId: string): Promise<void>;
    private generateTokens;
}
