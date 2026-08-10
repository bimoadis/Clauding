import { Controller, Post, Body, UnauthorizedException, Delete, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SiwsService, SiwsVerifyDto } from './siws.service';
import { db } from '../db/db';
import { users, nonces } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthGuard } from './auth.guard';

interface NonceResponse {
  nonce: string;
  expiresAt: string;
}

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly siwsService: SiwsService,
    private readonly jwtService: JwtService
  ) {}

  @Post('nonce')
  public async generateNonce(@Body() body: { publicKey: string }): Promise<NonceResponse> {
    if (!body.publicKey) {
      throw new UnauthorizedException('Public key is required');
    }
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL
    
    // Clear any previous nonce for this wallet
    await db.delete(nonces).where(eq(nonces.wallet, body.publicKey));
    
    // Insert new nonce to DB
    await db.insert(nonces).values({
      nonce,
      wallet: body.publicKey,
      expiresAt
    });
    
    return {
      nonce,
      expiresAt: expiresAt.toISOString()
    };
  }

  @Post('verify')
  public async verifySignature(
    @Body() body: { publicKey: string; message: string; signature: string }
  ) {
    const { publicKey, message, signature } = body;
    if (!publicKey || !message || !signature) {
      throw new UnauthorizedException('publicKey, message, and signature are required');
    }

    // 1. Retrieve nonce from database
    const nonceRecord = await db.select().from(nonces).where(eq(nonces.wallet, publicKey)).limit(1).then(r => r[0]);
    if (!nonceRecord) {
      throw new UnauthorizedException('Nonce not found or expired. Request a new nonce first.');
    }

    if (nonceRecord.expiresAt.getTime() < Date.now()) {
      await db.delete(nonces).where(eq(nonces.wallet, publicKey));
      throw new UnauthorizedException('Nonce has expired');
    }

    // 2. Validate nonce exists inside the message
    if (!message.includes(nonceRecord.nonce)) {
      throw new UnauthorizedException('Nonce mismatch in SIWS message');
    }

    // 3. Cryptographically verify signature
    const verifyDto: SiwsVerifyDto = {
      wallet: publicKey,
      message,
      signature
    };

    const isVerified = this.siwsService.verify(verifyDto);
    if (!isVerified) {
      throw new UnauthorizedException('Cryptographic signature verification failed');
    }

    // Nonce is single-use: invalidate it immediately
    await db.delete(nonces).where(eq(nonces.wallet, publicKey));

    // 4. Find or create user record
    let userRecord = await db.select().from(users).where(eq(users.wallet, publicKey)).limit(1).then(r => r[0]);
    if (!userRecord) {
      const [newUser] = await db.insert(users).values({ wallet: publicKey }).returning();
      userRecord = newUser;
    }

    // 5. Generate JWT token
    const payload = { sub: publicKey, userId: userRecord.id };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token
    };
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  public async deleteAccount(@Req() req: any) {
    const walletAddress = req.user.sub;
    if (!walletAddress) {
      throw new UnauthorizedException();
    }
    try {
      await db.delete(users).where(eq(users.wallet, walletAddress));
      return { success: true, message: 'Account and all associated data deleted successfully.' };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
