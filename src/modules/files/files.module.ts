import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../common/services/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [],
  providers: [],
})
export class FilesModule {}
