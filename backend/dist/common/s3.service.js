"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
let S3Service = class S3Service {
    constructor(configService) {
        this.configService = configService;
        this.supportedTypes = {
            'image/jpeg': { extension: 'jpg', category: 'images' },
            'image/jpg': { extension: 'jpg', category: 'images' },
            'image/png': { extension: 'png', category: 'images' },
            'image/gif': { extension: 'gif', category: 'images' },
            'image/webp': { extension: 'webp', category: 'images' },
            'video/mp4': { extension: 'mp4', category: 'videos' },
            'video/quicktime': { extension: 'mov', category: 'videos' },
            'video/x-msvideo': { extension: 'avi', category: 'videos' },
            'video/webm': { extension: 'webm', category: 'videos' },
            'application/pdf': { extension: 'pdf', category: 'documents' },
            'application/msword': { extension: 'doc', category: 'documents' },
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extension: 'docx', category: 'documents' },
            'application/vnd.ms-excel': { extension: 'xls', category: 'documents' },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { extension: 'xlsx', category: 'documents' },
            'text/plain': { extension: 'txt', category: 'documents' },
        };
        this.maxFileSize = 100 * 1024 * 1024;
        this.s3Client = new client_s3_1.S3Client({
            region: this.configService.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            },
        });
        this.bucketName = this.configService.get('AWS_S3_BUCKET');
        this.cloudfrontUrl = this.configService.get('AWS_S3_CLOUDFRONT_URL');
    }
    async generatePresignedUrl(request) {
        if (!this.supportedTypes[request.fileType]) {
            throw new common_1.BadRequestException(`Unsupported file type: ${request.fileType}`);
        }
        if (request.fileSize > this.maxFileSize) {
            throw new common_1.BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`);
        }
        const fileInfo = this.supportedTypes[request.fileType];
        const timestamp = Date.now();
        const uniqueId = (0, uuid_1.v4)();
        const key = `media/${fileInfo.category}/${timestamp}-${uniqueId}.${fileInfo.extension}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: request.fileType,
            ContentLength: request.fileSize,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, {
            expiresIn: 15 * 60,
        });
        const mediaUrl = this.cloudfrontUrl
            ? `${this.cloudfrontUrl}/${key}`
            : `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
        return {
            uploadUrl,
            mediaUrl,
            key,
        };
    }
    validateMediaUrl(mediaUrl) {
        if (!mediaUrl)
            return false;
        const bucketUrl = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/`;
        const cloudfrontUrl = this.cloudfrontUrl;
        return mediaUrl.startsWith(bucketUrl) || (cloudfrontUrl && mediaUrl.startsWith(cloudfrontUrl));
    }
    getSupportedTypes() {
        return this.supportedTypes;
    }
    getMaxFileSize() {
        return this.maxFileSize;
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Service);
//# sourceMappingURL=s3.service.js.map