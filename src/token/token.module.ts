import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';

@Module({
  controllers: [TokenController],
  exports: []
})
export class TokenModule {}
