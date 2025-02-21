import { ApiProperty } from '@nestjs/swagger';
import { TemplateDto } from './template.dto';

export class TemplateResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: TemplateDto })
  data?: TemplateDto;
}

export class TemplateListResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [TemplateDto] })
  data: TemplateDto[];
}
