import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';

@Module({
  controllers: [MailController],
  exports: []
})
export class MailModule {}
