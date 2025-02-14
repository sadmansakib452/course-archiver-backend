import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../../common/dto/base-response.dto';
import { UserRole, UserStatus } from '@prisma/client';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty()
  department: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({ type: UserDto })
  data: UserDto;
}

export class ListUsersResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: [UserDto],
    description: 'Array of users',
  })
  data: UserDto[];

  @ApiProperty({
    description: 'Total number of users',
    example: 100,
  })
  total: number;
}

export class UserActionResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'ID of the affected user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Timestamp of the action',
    example: '2024-03-14T12:00:00Z',
  })
  actionTimestamp: Date;
}
