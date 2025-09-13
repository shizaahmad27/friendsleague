import { AuthService, AuthResponse } from './auth.service';
import { SignUpDto, SignInDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signUp(signUpDto: SignUpDto): Promise<AuthResponse>;
    signIn(signInDto: SignInDto): Promise<AuthResponse>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
}
