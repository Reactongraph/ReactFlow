import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuid } from 'uuid'

export interface UploadedFile {
  originalName: string
  mimeType: string
  size: number
  url: string
  key: string
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly localPath: string
  private readonly driver: string

  constructor(private readonly config: ConfigService) {
    this.driver    = config.get<string>('storage.driver') ?? 'local'
    this.localPath = config.get<string>('storage.localPath') ?? './uploads'

    if (this.driver === 'local') {
      fs.mkdirSync(this.localPath, { recursive: true })
    }
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadedFile> {
    const ext = path.extname(originalName)
    const key = `${uuid()}${ext}`

    if (this.driver === 'local') {
      return this.uploadLocal(buffer, key, originalName, mimeType)
    }

    // S3 driver — requires aws-sdk installed
    return this.uploadS3(buffer, key, originalName, mimeType)
  }

  async delete(key: string): Promise<void> {
    if (this.driver === 'local') {
      const filePath = path.join(this.localPath, key)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
    // S3 deletion would go here
  }

  private async uploadLocal(
    buffer: Buffer,
    key: string,
    originalName: string,
    mimeType: string,
  ): Promise<UploadedFile> {
    const filePath = path.join(this.localPath, key)
    fs.writeFileSync(filePath, buffer)
    this.logger.log(`File saved locally: ${filePath}`)
    return {
      originalName,
      mimeType,
      size: buffer.length,
      url:  `/uploads/${key}`,
      key,
    }
  }

  private async uploadS3(
    _buffer: Buffer,
    key: string,
    originalName: string,
    mimeType: string,
  ): Promise<UploadedFile> {
    // Install @aws-sdk/client-s3 and implement S3 upload
    throw new Error('S3 driver not yet configured — set STORAGE_DRIVER=local or install @aws-sdk/client-s3')
  }
}
