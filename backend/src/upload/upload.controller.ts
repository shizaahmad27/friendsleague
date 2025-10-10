import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { S3Service, PresignedUrlRequest, PresignedUrlResponse } from '../common/s3.service';
import { PresignedUrlDto } from './dto/upload.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private s3Service: S3Service) {}

  @Post('presigned-url')
  async getPresignedUrl(
    @Request() req: any,
    @Body() presignedUrlDto: PresignedUrlDto,
  ): Promise<PresignedUrlResponse> {
    const request: PresignedUrlRequest = {
      fileName: presignedUrlDto.fileName,
      fileType: presignedUrlDto.fileType,
      fileSize: presignedUrlDto.fileSize,
    };

    return this.s3Service.generatePresignedUrl(request);
  }
}
