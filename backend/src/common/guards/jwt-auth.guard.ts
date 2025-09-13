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
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      
      request.user = payload;
      return true;
    } catch (error) {
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