import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  
  // CORS configuration - allow all origins in development for easier debugging
  const corsOrigin = process.env.NODE_ENV === 'production' 
    ? (process.env.WEB_URL || process.env.CORS_ORIGIN || 'http://localhost:3000')
    : true; // Allow all origins in development
  
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  const port = process.env.API_PORT || 3001;
  const host = process.env.API_HOST || '0.0.0.0'; // Bind to all interfaces for external access
  await app.listen(port, host);
  console.log(`API server running on http://${host}:${port}`);
}

bootstrap();

