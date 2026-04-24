import { Global, Module } from '@nestjs/common';
import { TokenLoggerService } from './token-logger.service';

@Global()
@Module({
  providers: [TokenLoggerService],
  exports: [TokenLoggerService],
})
export class LoggerModule {}
