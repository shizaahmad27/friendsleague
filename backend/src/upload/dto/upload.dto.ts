import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class PresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB
  fileSize: number;
}
