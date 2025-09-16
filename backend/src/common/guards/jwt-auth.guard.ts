import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    console.log('JWT Guard - Token received:', token ? token.substring(0, 20) + '...' : 'No token');
    console.log('JWT Guard - JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      console.log('JWT Guard - Token verified successfully:', payload);
      // Normalize payload to expected shape
      request.user = {
        id: (payload as any).sub,
        username: (payload as any).username,
        ...payload,
      };
      return true;
    } catch (error) {
      console.error('JWT Guard - Token verification failed:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}


// Info om hva som skjer her:

// Hneter token fra authorization header
// verfifiserer token med secret
// setter user info på request objektet
// returnerer true hvis token er valid, false ellers. 

// eksempler på bruk
// @UseGuards(JwtAuthGuard)
//@UseGuards(RolesGuard)        // Sjekk brukerrolle
//@UseGuards(PermissionGuard)   // Sjekk spesifikke tillatelser
//@UseGuards(RateLimitGuard)   // begrens antall requests 