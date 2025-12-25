import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from '@pokedex-go/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          displayName: dto.displayName,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
        },
      });
      
      return user;
    } catch (error) {
      this.logger.error('Registration error', error);
      
      // Handle Prisma errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        throw new ConflictException('User with this email already exists');
      }
      
      if (error.code === 'P1001') {
        // Cannot reach database server
        throw new InternalServerErrorException('Database connection failed. Please check your database configuration.');
      }

      if (error.message && error.message.includes('does not exist')) {
        // Table doesn't exist - migrations not run
        throw new InternalServerErrorException('Database tables not found. Please run migrations: npm run db:migrate');
      }

      // Re-throw NestJS HTTP exceptions
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      // Generic error
      throw new InternalServerErrorException('Failed to register user. Please try again.');
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }
    
    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);
    
    // Get user with theme preference
    const userWithTheme = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        theme: true,
      },
    });
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: userWithTheme.id,
        email: userWithTheme.email,
        displayName: userWithTheme.displayName,
        theme: userWithTheme.theme || 'default',
      },
    };
  }

  async createRefreshToken(userId: string): Promise<string> {
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    
    const token = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: refreshSecret,
        expiresIn,
      }
    );
    
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
    
    return token;
  }

  async refreshAccessToken(refreshToken: string) {
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
    
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      
      // Find all refresh tokens for this user and check if any match
      // Note: In production, you'd want to store tokens in a way that allows
      // efficient lookup (e.g., token hash as index, or use a different approach)
      const userTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId: payload.sub,
          expiresAt: {
            gt: new Date(),
          },
          revokedAt: null,
        },
      });
      
      // Check if any token matches (simplified - in production use proper hash comparison)
      let tokenFound = false;
      for (const tokenRecord of userTokens) {
        const matches = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
        if (matches) {
          tokenFound = true;
          break;
        }
      }
      
      if (!tokenFound) {
        throw new UnauthorizedException('Refresh token not found or expired');
      }
      
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      const newPayload = { sub: user.id, email: user.email };
      const accessToken = this.jwtService.sign(newPayload);
      
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUserPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        theme: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      theme: user.theme || 'default',
    };
  }

  async updateUserTheme(userId: string, theme: string) {
    // Validate theme
    const validThemes = ['default', 'horizons', 'scarlet-violet'];
    if (!validThemes.includes(theme)) {
      throw new BadRequestException(`Invalid theme. Must be one of: ${validThemes.join(', ')}`);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { theme },
      select: {
        id: true,
        theme: true,
      },
    });

    return {
      theme: user.theme || 'default',
    };
  }
}

