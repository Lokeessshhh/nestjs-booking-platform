import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Use global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip out properties that are not defined in DTOs
      transform: true, // auto-transform payloads to match DTO types
    }),
  );

  // Use global HTTP Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configure Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('EN2H Booking Platform API')
    .setDescription(
      'A robust booking platform REST API constructed with NestJS, TypeScript, and PostgreSQL (Neon). Supports user auth, services management, and customer booking scheduling.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'bearer', // This matches the security name in controllers
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
