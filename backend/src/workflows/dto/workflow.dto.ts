import {
  IsString, IsOptional, IsBoolean, IsArray,
  IsObject, MaxLength, MinLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateWorkflowDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  nodes?: unknown[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  edges?: unknown[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  nodes?: unknown[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  edges?: unknown[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>
}

export class SaveVersionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string
}

export class WorkflowQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  tag?: string

  @IsOptional()
  page?: number

  @IsOptional()
  limit?: number
}
