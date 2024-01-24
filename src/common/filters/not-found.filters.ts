import { ArgumentsHost, Catch, NotFoundException, BadRequestException, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(NotFoundException, BadRequestException)
export class NotFoundAndBadRequestFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || 'Internal Server Error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
