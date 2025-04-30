import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as otel from '../otel';

@Injectable()
export class TelemetryMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tracing context from incoming request headers (if any)
    otel.extract(req.headers as Record<string, string>);

    // Inject tracing context into the response headers
    const carrier = otel.inject({});
    Object.entries(carrier).forEach(([k, v]) => {
      res.setHeader(k, v);
    });

    // update metrics
    otel.counters.requests.add(1, { path: req.path, method: req.method });

    // Start a new span for this request
    const span = otel.startSpan('http_request', {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': req.route?.path || req.path,
      'http.host': req.hostname,
    });

    // Set up a listener to end the span when the response is finished
    res.on('finish', () => {
      span.setAttribute('statusCode', res.statusCode);
      span.end();
    });

    // Call the next middleware or route handler
    next();
  }
}
