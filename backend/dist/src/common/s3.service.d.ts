import { ConfigService } from '@nestjs/config';
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
export declare class S3Service {
    private configService;
    private s3Client;
    private bucketName;
    private cloudfrontUrl?;
    private readonly supportedTypes;
    private readonly maxFileSize;
    constructor(configService: ConfigService);
    generatePresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse>;
    validateMediaUrl(mediaUrl: string): boolean;
    getSupportedTypes(): Record<string, {
        extension: string;
        category: string;
    }>;
    getMaxFileSize(): number;
}
