import { ApiProperty as Property } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @Property({
    example: 'abc123def456',
    description: 'Reset token received via email',
  })
  @IsString()
  token: string;

  @Property({
    example: 'NewPass123!',
    description: 'New password must contain uppercase, lowercase, and number',
  })
  @IsString()
  @MinLength(6)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  newPassword: string;
}
