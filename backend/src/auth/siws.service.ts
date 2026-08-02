import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface SiwsVerifyDto {
  wallet: string;       // Solana base58 address
  message: string;      // SIWS formatted message content
  signature: string;    // Base58 or Hex signature
}

@Injectable()
export class SiwsService {
  /**
   * Verifies the SIWS cryptographic signature against the user's wallet address.
   */
  public verify(dto: SiwsVerifyDto): boolean {
    try {
      const pubKey = bs58.decode(dto.wallet);
      const signatureBytes = this.decodeSignature(dto.signature);
      const messageBytes = new TextEncoder().encode(dto.message);

      // Verify signature
      const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, pubKey);
      if (!isValid) {
        throw new UnauthorizedException('Invalid SIWS signature');
      }

      // Optional: Parse message to check for expirations and nonces
      this.validateMessageConstraints(dto.message);

      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Solana SIWS verification failed'
      );
    }
  }

  private decodeSignature(signature: string): Uint8Array {
    try {
      // Try decoding base58 first, fallback to hex
      if (signature.match(/^[1-9A-HJ-NP-Za-km-z]+$/)) {
        return bs58.decode(signature);
      }
      return new Uint8Array(Buffer.from(signature, 'hex'));
    } catch {
      throw new UnauthorizedException('Signature format is invalid');
    }
  }

  private validateMessageConstraints(message: string): void {
    // Basic checks on the structured SIWS text layout
    // Example: Expiration date or Domain match validation
    const expirationMatch = message.match(/Expiration Time: ([^\n]+)/);
    if (expirationMatch) {
      const expDate = new Date(expirationMatch[1]);
      if (expDate.getTime() < Date.now()) {
        throw new UnauthorizedException('SIWS Message signature has expired');
      }
    }
  }
}
