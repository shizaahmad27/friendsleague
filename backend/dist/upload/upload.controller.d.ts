import { S3Service, PresignedUrlResponse } from '../common/s3.service';
import { PresignedUrlDto } from './dto/upload.dto';
export declare class UploadController {
    private s3Service;
    constructor(s3Service: S3Service);
    getPresignedUrl(req: any, presignedUrlDto: PresignedUrlDto): Promise<PresignedUrlResponse>;
}
