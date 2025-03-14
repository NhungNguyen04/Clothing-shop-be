import { Controller, FileTypeValidator, Logger, ParseFilePipe, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {

  constructor(private readonly uploadService: UploadService) {}

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
