import { ApiProperty as Property } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @Property({
    example: 'abc123def456',
    description: 'Reset token received via email',
  })
  @IsString()
  token: string;

  @Property({
    example: 'NewPass123!',
    description:
      'New password must be at least 8 characters with uppercase, lowercase, and number',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
