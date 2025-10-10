import { JwtService } from '@nestjs/jwt';
import { AuthService, AuthResponse } from './auth.service';
import { SignUpDto, SignInDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    private jwtService;
    constructor(authService: AuthService, jwtService: JwtService);
    signUp(signUpDto: SignUpDto): Promise<AuthResponse>;
    signIn(signInDto: SignInDto): Promise<AuthResponse>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    testToken(body: {
        token: string;
    }): Promise<{
        valid: boolean;
        payload?: any;
        error?: string;
    }>;
}
