import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class PermanentDeleteUserDto {
  @ApiProperty({
    description: 'Reason for permanent deletion',
    example: 'User requested account deletion',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;
}
