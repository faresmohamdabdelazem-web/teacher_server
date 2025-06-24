import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const res = context.switchToHttp().getResponse();

        if (!data)
          return {
            status: true,
          };

        if (data.refreshToken) {
          res.cookie('refreshToken', data.refreshToken, {
            httpOnly: process.env.NODE_ENV == 'dev' ? false : true,
            secure: process.env.NODE_ENV == 'dev' ? false : true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            
          });
          // Remove the refreshToken from the response body
          // delete data.refreshToken;
        }

        return {
          ...data,
          status: true,
        };
      }),
    );
  }
}
