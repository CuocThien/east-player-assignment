import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';
import { UploadFileDto } from './dto/upload-payload.dto';
import { map, chunk } from 'lodash';
import * as fs from 'fs';
import { createReadStream } from 'fs';

@Injectable()
export class StorageService {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('minio.endPoint'),
      port: this.configService.get('minio.port'),
      useSSL: this.configService.get('minio.useSSL'),
      accessKey: this.configService.get('minio.accessKey'),
      secretKey: this.configService.get('minio.secretKey'),
    });

    this.bucket = this.configService.get('minio.bucket');
    this.initializeBucket();
  }

  private async initializeBucket() {
    const bucketExists = await this.minioClient.bucketExists(this.bucket);
    if (!bucketExists) {
      await this.minioClient.makeBucket(this.bucket);
    }
  }

  async uploadFile(file: Express.Multer.File & { path?: string }, fileName: string): Promise<string> {
    let fileStream: Readable;
    
    if (file.path) {
      fileStream = createReadStream(file.path);
    } else if (file.buffer) {
      fileStream = Readable.from(file.buffer);
    } else {
      throw new Error('File must have either a path or buffer');
    }

    await this.minioClient.putObject(
      this.bucket,
      fileName,
      fileStream,
      file.size,
      {
        'Content-Type': file.mimetype,
      },
    );

    if (file.path) {
      try {
        await fs.promises.unlink(file.path);
      } catch (error) {
        console.error('Error cleaning up temporary file:', error);
      }
    }

    return fileName;
  }

  async uploadFiles(files: UploadFileDto[]): Promise<string[]> {
    const uploadedPayloads: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i].file;
      const fileName = files[i].fileName;
      const uploadedPayload = {
        fileName: fileName,
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.size,
      }
      uploadedPayloads.push(uploadedPayload);
    }
    const chunkedPayloads = chunk(uploadedPayloads, 500);
    for (let i = 0; i < chunkedPayloads.length; i++) {
      const chunk = chunkedPayloads[i];
      await Promise.all(chunk.map(async (p) => this.minioClient.putObject(this.bucket, p.fileName, Readable.from(p.buffer), p.size, { 'Content-Type': p.mimetype })));
    }
    return map(uploadedPayloads, 'fileName');
  }

  async uploadStream(
    stream: Readable,
    fileName: string,
    size: number,
    contentType: string,
  ): Promise<string> {
    await this.minioClient.putObject(
      this.bucket,
      fileName,
      stream,
      size,
      {
        'Content-Type': contentType,
      },
    );
    return fileName;
  }

  async getFileBuffer(fileName: string): Promise<Buffer[]> {
    const stream = await this.minioClient.getObject(this.bucket, fileName);
    
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    return chunks;
  }

  async getFileUrl(fileName: string): Promise<string> {
    return await this.minioClient.presignedGetObject(this.bucket, fileName);
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, fileName);
  }
} 