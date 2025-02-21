import { Module } from '@nestjs/common';
import { FileTemplatesController } from './file-templates.controller';
import { FileTemplatesService } from './file-templates.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FileTemplatesController],
  providers: [FileTemplatesService],
  exports: [FileTemplatesService],
})
export class FileTemplatesModule {}
