import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // Make it available everywhere
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

