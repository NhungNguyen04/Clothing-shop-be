import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import * as session from 'express-session';
import * as passport from 'passport';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Session } from 'inspector/promises';

async function bootstrap() {
  // Force console to show all logs
  console.log = console.log.bind(console);
  console.error = console.error.bind(console);
  console.warn = console.warn.bind(console);
  console.info = console.info.bind(console);
  console.debug = console.debug.bind(console);

  // Log startup message
  console.log('=== STARTUP: Application bootstrapping ===');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Enable CORS
  app.enableCors();
  
  // Add session middleware before passport initialization
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000 * 60 * 24, // 1 day
      } as session.CookieOptions
    }),
  );
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Add middleware to log all requests
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - REQUEST: ${req.method} ${req.url}`);
    next();
  });

  // Add midleware to log all console.log
  console.log = (message: string) => {
    console.info(`LOG: ${message}`);
  };

  const config = new DocumentBuilder()
    .setTitle('Clothing shop')
    .setDescription('The clothing shop API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3300);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log('=== STARTUP: Application successfully started ===');
}
bootstrap().catch(err => {
  console.error('Application failed to start:', err);
  process.exit(1);
});