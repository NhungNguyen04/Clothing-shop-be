import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { TryOnRequestDto } from './tryon.dto';

@Injectable()
export class TryOnService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async generateTryOnImage(payload: TryOnRequestDto): Promise<string> {
    const serviceUrl = this.configService.get<string>('TRY_ON_SERVICE_URL');
    if (!serviceUrl) {
      throw new Error('TRY_ON_SERVICE_URL is not configured');
    }

    const normalizedUrl = serviceUrl.replace(/\/+$/, '');
    const response = await firstValueFrom(
      this.httpService.post(
        `${normalizedUrl}/try-on`,
        payload,
        { timeout: 120000 }
      )
    );

    const imageUrl = response.data?.imageUrl || response.data?.data?.imageUrl;
    if (!imageUrl) {
      throw new Error('Try-on service did not return imageUrl');
    }

    return imageUrl;
  }
}
