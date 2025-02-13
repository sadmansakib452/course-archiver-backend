import { Controller, UseGuards } from '@nestjs/common';
import { ApiRoleAuth } from '../../common/decorators/api-role-auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiRoleAuth('CHAIRPERSON', 'Department Management')
@Controller('chairperson')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CHAIRPERSON)
export class ChairpersonController {
  // ... controller methods
}
