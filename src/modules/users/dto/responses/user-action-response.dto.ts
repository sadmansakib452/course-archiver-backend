import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../../common/dto/base-response.dto';

export class UserActionResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'ID of the user affected by the action' })
  userId: string;

  @ApiProperty({ description: 'Timestamp when the action was performed' })
  actionTimestamp: Date;

  @ApiProperty({ description: 'Success status of the operation' })
  success: boolean;

  @ApiProperty({ description: 'Message describing the action result' })
  message: string;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: Date;
}
