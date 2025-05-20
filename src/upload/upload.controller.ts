import { Controller, FileTypeValidator, Logger, ParseFilePipe, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {

  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile(
    new ParseFilePipe({
      validators: [
        new FileTypeValidator({ fileType: /image\/(png|jpeg|jpg)/ })  
      ]
    })
  ) file: Express.Multer.File) {
    const result = await this.uploadService.upload(file.originalname, file.buffer);
    return {
      success: true,
      message: 'File uploaded successfully',
      error: null,
      data: result
    };
  }

  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultipleFiles(@UploadedFiles(
    new ParseFilePipe({
      validators: [
        new FileTypeValidator({ fileType: /image\/(png|jpeg|jpg)/ })  
      ]
    })
  ) files: Express.Multer.File[]) {
    const results = await Promise.all(files.map(async file => {
      return await this.uploadService.upload(file.originalname, file.buffer);
    }));
    return {
      success: true,
      message: 'Files uploaded successfully',
      error: null,
      data: results
    };
  }
}
