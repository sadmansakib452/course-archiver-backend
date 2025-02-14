import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserActivityService } from './services/activity.service';
import { UserStatusService } from './services/user-status.service';
import { UserProfileService } from './services/user-profile.service';
import { UserAdminService } from './services/user-admin.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserActivityService,
    UserStatusService,
    UserProfileService,
    UserAdminService,
  ],
  exports: [
    UsersService,
    UserActivityService,
    UserStatusService,
    UserProfileService,
    UserAdminService,
  ],
})
export class UsersModule {}
