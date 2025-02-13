import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateFacultyDto {
  @ApiProperty({ example: 'JD' })
  @IsString()
  @IsNotEmpty()
  shortName: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john.doe@university.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Assistant Professor' })
  @IsString()
  @IsNotEmpty()
  designation: string;
}
