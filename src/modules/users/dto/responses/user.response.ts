import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class UserResponseDto {
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

export class ArchivedUserResponseDto extends UserResponseDto {
  @ApiProperty({ required: false, nullable: true })
  archivedAt: Date | null;

  @ApiProperty({ required: false, nullable: true })
  archivedReason: string | null;

  @ApiProperty({ required: false, nullable: true })
  archivedBy: {
    name: string;
    role: UserRole;
  } | null;
}

export class StatusUpdateResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class ArchiveUserResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: ArchivedUserResponseDto })
  user: ArchivedUserResponseDto;
}

export class DeletedUserResponseDto extends UserResponseDto {
  @ApiProperty()
  deletedAt: Date;

  @ApiProperty()
  deletedReason: string;

  @ApiProperty({
    type: 'object',
    properties: {
      name: { type: 'string' },
      role: { enum: UserRole },
    },
  })
  deletedBy: {
    name: string;
    role: UserRole;
  };
}

export class DeleteUserResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: DeletedUserResponseDto })
  user: DeletedUserResponseDto;
}
