import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpStatus 
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = exception.meta?.target as string[];
        message = `Unique constraint failed on the field: ${target ? target.join(', ') : 'unknown'}`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      }
      // Add other Prisma error codes as needed
    }

    response.status(status).json({
      success: false,
      message,
      error: exception.code,
      timestamp: new Date().toISOString(),
    });
  }
}
