import { ApiProperty as Property } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @Property({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @Property({
    example: 'CurrentPass123!',
    required: false,
    description: 'Required only when changing password',
  })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @Property({
    example: 'NewPass123!',
    required: false,
    description: 'Must contain uppercase, lowercase, number',
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  newPassword?: string;
}
