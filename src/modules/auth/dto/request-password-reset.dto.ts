import { ApiProperty as Property } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
  @Property({
    example: 'faculty@university.edu',
    description: 'Email address associated with the account',
  })
  @IsEmail()
  email: string;
}
