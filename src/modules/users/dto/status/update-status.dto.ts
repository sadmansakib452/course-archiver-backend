import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    description: 'New status for the user',
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({
    required: false,
    description: 'Reason for status change',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
