import { Controller, Post, Body, UseGuards, Request, Get, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '@pokedex-go/shared';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Request() req) {
    return this.authService.getUserPreferences(req.user.id);
  }

  @Put('preferences/theme')
  @UseGuards(JwtAuthGuard)
  async updateTheme(@Request() req, @Body('theme') theme: string) {
    return this.authService.updateUserTheme(req.user.id, theme);
  }
}

