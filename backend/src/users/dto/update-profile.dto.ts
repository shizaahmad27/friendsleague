import { IsString, IsOptional, MinLength, MaxLength, Matches, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_!?]+$/, {
    message: 'Username can only contain letters, numbers, and special characters ! and ?',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, {
    message: 'Bio must be 150 characters or less',
  })
  bio?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid international format',
  })
  phoneNumber?: string;
}

