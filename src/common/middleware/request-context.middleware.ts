import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../interfaces/request-context.interface';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    RequestContext.set({
      requestId: uuid(),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date(),
    });
    next();
  }
}
