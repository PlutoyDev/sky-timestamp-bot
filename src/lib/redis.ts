import { REDIS_URL } from './enviroment';
import { createClient } from 'redis';

const RedisGlobal = global as typeof global & {
  redis: ReturnType<typeof createClient>;
};

export const redis =
  RedisGlobal.redis ??
  createClient({
    url: REDIS_URL,
  });

redis.connect();

export default redis;
