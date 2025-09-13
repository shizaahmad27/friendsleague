import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // All fields from CreateUserDto are optional in UpdateUserDto
  // Password updates should be handled separately for security
}
