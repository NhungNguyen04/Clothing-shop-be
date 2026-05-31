import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TryOnController } from './tryon.controller';
import { TryOnService } from './tryon.service';

@Module({
  imports: [HttpModule],
  controllers: [TryOnController],
  providers: [TryOnService],
})
export class TryOnModule {}
