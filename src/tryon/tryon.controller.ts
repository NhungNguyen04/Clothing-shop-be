import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TryOnService } from './tryon.service';
import { TryOnRequestDto } from './tryon.dto';

@ApiTags('TryOn')
@Controller('try-on')
export class TryOnController {
  constructor(private readonly tryOnService: TryOnService) {}

  @ApiOperation({ summary: 'Generate a virtual try-on image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        personImageUrl: { type: 'string' },
        productImageUrl: { type: 'string' },
      },
      required: ['personImageUrl', 'productImageUrl'],
    },
  })
  @ApiResponse({ status: 201, description: 'Try-on image generated' })
  @Post()
  async generateTryOn(@Body() body: TryOnRequestDto) {
    const imageUrl = await this.tryOnService.generateTryOnImage(body);
    return {
      success: true,
      message: 'Try-on image generated',
      error: null,
      data: {
        imageUrl,
      },
    };
  }
}
