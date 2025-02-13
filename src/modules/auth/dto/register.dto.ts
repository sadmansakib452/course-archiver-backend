import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty as Property } from '@nestjs/swagger';

export class RegisterDto {
  @Property({ example: 'faculty@university.edu' })
  @IsEmail()
  email: string;

  @Property({
    example: 'Password123!',
    description:
      'Password must contain at least 1 uppercase, 1 lowercase, and 1 number',
  })
  @IsString()
  @MinLength(6)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  password: string;

  @Property({ example: 'John Doe' })
  @IsString()
  name: string;
}
