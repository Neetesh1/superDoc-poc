import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(6) password!: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['viewer','reviewer','editor','approver','linguistic_reviewer','external_collaborator'])
  role?: string;
}
