import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty as Property } from '@nestjs/swagger';

export class LoginDto {
  @Property({ example: 'faculty@university.edu' })
  @IsEmail()
  email: string;

  @Property({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password: string;
}
