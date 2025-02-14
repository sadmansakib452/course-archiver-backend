import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class StatusUpdateResponseDto {
  @ApiProperty({
    example: 'User status updated successfully',
  })
  message: string;

  @ApiProperty({
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    example: {
      previousStatus: 'ACTIVE',
      newStatus: 'INACTIVE',
      timestamp: '2024-03-14T12:00:00Z',
    },
  })
  statusChangeDetails: {
    previousStatus: string;
    newStatus: string;
    timestamp: Date;
  };
}
