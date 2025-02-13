import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ArchiveUserDto {
  @ApiProperty({
    description: 'Reason for archiving the user',
    example: 'User no longer active in department',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;
}
