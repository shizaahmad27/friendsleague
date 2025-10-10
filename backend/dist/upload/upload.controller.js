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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const s3_service_1 = require("../common/s3.service");
const upload_dto_1 = require("./dto/upload.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let UploadController = class UploadController {
    constructor(s3Service) {
        this.s3Service = s3Service;
    }
    async getPresignedUrl(req, presignedUrlDto) {
        const request = {
            fileName: presignedUrlDto.fileName,
            fileType: presignedUrlDto.fileType,
            fileSize: presignedUrlDto.fileSize,
        };
        return this.s3Service.generatePresignedUrl(request);
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('presigned-url'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upload_dto_1.PresignedUrlDto]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getPresignedUrl", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [s3_service_1.S3Service])
], UploadController);
//# sourceMappingURL=upload.controller.js.map