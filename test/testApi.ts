import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@src/app.module';
import { Test } from '@nestjs/testing';

export const startApp = async () => {
  const redisServer = new RedisMemoryServer();
  const [mongod, redisServerInstance] = await Promise.all([
    MongoMemoryReplSet.create(),
    redisServer.ensureInstance(),
  ]);
  await mongod.waitUntilRunning();
  const mongoUri = mongod.getUri();
  const redisUri = `redis://${redisServerInstance.ip}:${redisServerInstance.port}`;
  const factory = () => {
    const configService = new ConfigService();
    configService.set('MONGO_URI', mongoUri);
    configService.set('REDIS_URI', redisUri);
    return configService;
  };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ConfigService)
    .useFactory({ factory })
    .compile();
  const app = await module.createNestApplication().init();
  const stop = async () => {
    app.flushLogs();
    await app.close();
    await redisServer.stop();
    await mongod.stop();
  };
  return {
    [Symbol.asyncDispose]: stop,
    app,
  };
};
