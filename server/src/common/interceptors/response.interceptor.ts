import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../filters/global-exception.filter';

export function responseInterceptor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const originalJson = res.json.bind(res);

  res.json = function (body: ApiResponse | any) {
    if (body && typeof body === 'object' && 'code' in body) {
      return originalJson(body);
    }

    const response: ApiResponse = {
      code: res.statusCode >= 400 ? res.statusCode : 0,
      message: res.statusCode >= 400 ? 'Error' : 'Success',
      data: body,
      timestamp: new Date().toISOString(),
    };

    return originalJson(response);
  };

  next();
}
