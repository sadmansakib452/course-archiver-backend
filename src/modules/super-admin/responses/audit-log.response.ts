import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

class UserInfo {
  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;
}

export class AuditLogResponse {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  userId: string;

  @ApiProperty({
    example: 'USER_LOGIN',
    description: 'Type of action performed',
  })
  action: string;

  @ApiProperty({
    example: { ip: '192.168.1.1', browser: 'Chrome' },
    description: 'Additional details about the action',
  })
  details: Prisma.JsonValue;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    type: UserInfo,
    description: 'User who performed the action',
  })
  user: UserInfo;
}
