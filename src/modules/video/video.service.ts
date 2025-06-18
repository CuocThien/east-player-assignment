import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { StorageService } from '../storage/storage.service';
import { UploadFileDto } from '../storage/dto/upload-payload.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Readable } from 'stream';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class VideoService {
  constructor(private readonly storageService: StorageService) {}

  async extractFrames(videoBuffer: Buffer, interval: number = 10): Promise<{ frameFileNames: string[], folder: string }> {
    const frameFileNames: string[] = [];
    const tempVideoPath = path.join(os.tmpdir(), `video-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);

    await fs.writeFile(tempVideoPath, videoBuffer);
    const start = videoBuffer.indexOf(Buffer.from("mvhd")) + 16;
    const timeScale = videoBuffer.readUInt32BE(start);
    const duration = videoBuffer.readUInt32BE(start + 4);
    const movieLength = Math.floor(duration / timeScale);

    return new Promise((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .on('filenames', (filenames) => {
          frameFileNames.push(...filenames);
        })
        .on('end', async () => {
          await fs.unlink(tempVideoPath);
          resolve({frameFileNames, folder: path.dirname(tempVideoPath)});
        })
        .on('error', async (err) => {
          try {
            await fs.unlink(tempVideoPath);
          } catch (e) {
            // ignore cleanup error
          }
          reject(err);
        })
        .screenshots({
          count: 0,
          timemarks: Array.from({ length: Math.floor(movieLength / interval) }, (_, i) => `${i * interval}`), // every 10 seconds up to 1 hour
          folder: path.dirname(tempVideoPath),
          filename: 'frame-%i.jpg',
          size: '1280x720',
        });
    });
  }

  async processVideo(videoFile: Express.Multer.File): Promise<string[]> {
    // Upload video to storage
    const videoFileName = `videos/${Date.now()}-${videoFile.originalname}`;
    await this.storageService.uploadFile(videoFile, videoFileName);

    // Extract frames
    const { frameFileNames, folder } = await this.extractFrames(videoFile.buffer);

    // Upload frames to storage
    const timestamps = Date.now();
    const uploadedFramePayloads: UploadFileDto[] = [];
    for (let i = 0; i < frameFileNames.length; i++) {
      const frameName = frameFileNames[i];
      const frameBuffer = await this.readFileBuffer(path.join(folder, frameName));
      const frameFileName = `frames/${timestamps}-${frameName}`;
      uploadedFramePayloads.push({ file: { buffer: frameBuffer, originalname: frameName, mimetype: 'image/jpeg', size: frameBuffer.length } as Express.Multer.File, fileName: frameFileName });
    }
    return await this.storageService.uploadFiles(uploadedFramePayloads);
  }

  private async readFileBuffer(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }
} 