import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  mediaUrl: string;
  key: string;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudfrontUrl?: string;

  // Supported file types and their MIME types
  private readonly supportedTypes = {
    // Images
    'image/jpeg': { extension: 'jpg', category: 'images' },
    'image/jpg': { extension: 'jpg', category: 'images' },
    'image/png': { extension: 'png', category: 'images' },
    'image/gif': { extension: 'gif', category: 'images' },
    'image/webp': { extension: 'webp', category: 'images' },
    
    // Videos
    'video/mp4': { extension: 'mp4', category: 'videos' },
    'video/quicktime': { extension: 'mov', category: 'videos' },
    'video/x-msvideo': { extension: 'avi', category: 'videos' },
    'video/webm': { extension: 'webm', category: 'videos' },
    
    // Documents
    'application/pdf': { extension: 'pdf', category: 'documents' },
    'application/msword': { extension: 'doc', category: 'documents' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extension: 'docx', category: 'documents' },
    'application/vnd.ms-excel': { extension: 'xls', category: 'documents' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { extension: 'xlsx', category: 'documents' },
    'text/plain': { extension: 'txt', category: 'documents' },
  };

  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
    this.cloudfrontUrl = this.configService.get<string>('AWS_S3_CLOUDFRONT_URL');
  }

  async generatePresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    // Validate file type
    if (!this.supportedTypes[request.fileType]) {
      throw new BadRequestException(`Unsupported file type: ${request.fileType}`);
    }

    // Validate file size
    if (request.fileSize > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Generate unique key for the file
    const fileInfo = this.supportedTypes[request.fileType];
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const key = `media/${fileInfo.category}/${timestamp}-${uniqueId}.${fileInfo.extension}`;

    // Create presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: request.fileType,
      ContentLength: request.fileSize,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 15 * 60, // 15 minutes
    });

    // Generate the final media URL (use CloudFront if available, otherwise S3)
    const mediaUrl = this.cloudfrontUrl 
      ? `${this.cloudfrontUrl}/${key}`
      : `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      mediaUrl,
      key,
    };
  }

  validateMediaUrl(mediaUrl: string): boolean {
    if (!mediaUrl) return false;
    
    // Check if URL is from our S3 bucket or CloudFront
    const bucketUrl = `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/`;
    const cloudfrontUrl = this.cloudfrontUrl;
    
    return mediaUrl.startsWith(bucketUrl) || (cloudfrontUrl && mediaUrl.startsWith(cloudfrontUrl));
  }

  getSupportedTypes(): Record<string, { extension: string; category: string }> {
    return this.supportedTypes;
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}
