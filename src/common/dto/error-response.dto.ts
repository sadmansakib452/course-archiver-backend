import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'USER_001' })
  errorCode: string;

  @ApiProperty({ example: 'User not found' })
  message: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  details?: Record<string, any>;

  @ApiProperty()
  timestamp: Date;
}
