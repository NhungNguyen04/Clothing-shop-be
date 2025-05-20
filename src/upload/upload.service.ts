import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async upload(fileName: string, file: Buffer): Promise<string> {
    const uniqueFileName = `${Date.now()}-${fileName.replace(/\s/g, '-')}`;
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueFileName,
          Body: file,
        })
      );

      const fileUrl = `https://${bucketName}.s3.${this.configService.get('AWS_S3_REGION')}.amazonaws.com/${uniqueFileName}`;
      Logger.log(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      Logger.error('Error uploading file to S3', error);
      throw error;
    }
  }
}