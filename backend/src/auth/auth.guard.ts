import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // For SSE stream endpoints, token can be passed in query parameter 'token'
    let token = this.extractTokenFromHeader(request);
    if (!token && request.query && request.query.token) {
      token = request.query.token;
    }

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'clauding_super_secret_key_123!'
      });
      // Assign payload to request object so we can access it in controllers
      request['user'] = payload;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
