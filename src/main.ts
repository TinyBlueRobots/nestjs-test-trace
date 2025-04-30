import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as otel from './otel';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   
  // Init otel
	const configService = app.get(ConfigService);
  const ENV = configService.get<string>('ENV', 'test');
  const serviceName = 'nestjs-basic-app';
  const version = configService.get<string>('VERSION') || '0.0.0';
  otel.initTracing(
    serviceName,
    version,
    ENV,
    otel.grpcSpanProcessor(),
    otel.consoleSpanProcessor(),
  );
  otel.initMetrics(serviceName, version, ENV, otel.grpcMetricReader());

  // Start the NestJS application
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => console.error('Bootstrap error:', err));
