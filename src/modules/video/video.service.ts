import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { StorageService } from '../storage/storage.service';
import { UploadFileDto } from '../storage/dto/upload-payload.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Readable } from 'stream';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

@Injectable()
export class VideoService {
  constructor(private readonly storageService: StorageService) { }

  async extractFrames(videoPath: string, interval: number = 10): Promise<{ frameFileNames: string[], folder: string }> {
    const frameFileNames: string[] = [];
    const outputFolder = path.join(os.tmpdir(), `frames-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    // Create output folder
    await fs.mkdir(outputFolder, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.warn('FFprobe failed, using default duration:', err.message);
          this.extractFramesWithDefaultDuration(videoPath, outputFolder, frameFileNames, resolve, reject);
          return;
        }

        const duration = metadata.format.duration || 0;
        const movieLength = Math.floor(duration);

        if (movieLength <= 0) {
          console.warn('Invalid duration from FFprobe, using default duration');
          this.extractFramesWithDefaultDuration(videoPath, outputFolder, frameFileNames, resolve, reject);
          return;
        }

        ffmpeg(videoPath)
          .on('filenames', (filenames) => {
            frameFileNames.push(...filenames);
          })
          .on('end', async () => {
            resolve({ frameFileNames, folder: outputFolder });
          })
          .on('error', async (err) => {
            try {
              await fs.rmdir(outputFolder, { recursive: true });
            } catch (e) {
              // ignore cleanup error
            }
            reject(err);
          })
          .screenshots({
            count: 0,
            timemarks: Array.from({ length: Math.floor(movieLength / interval) }, (_, i) => `${i * interval}`), // every 10 seconds up to 1 hour
            folder: outputFolder,
            filename: 'frame-%i.jpg',
            size: '1280x720',
          });
      });
    });
  }

  private extractFramesWithDefaultDuration(
    videoPath: string, 
    outputFolder: string, 
    frameFileNames: string[], 
    resolve: (value: { frameFileNames: string[], folder: string }) => void,
    reject: (reason: any) => void
  ) {
    // Extract frames at fixed intervals (every 10 seconds) for up to 10 minutes
    const timemarks = Array.from({ length: 60 }, (_, i) => `${i * 10}`);
    
    ffmpeg(videoPath)
      .on('filenames', (filenames) => {
        frameFileNames.push(...filenames);
      })
      .on('end', async () => {
        resolve({ frameFileNames, folder: outputFolder });
      })
      .on('error', async (err) => {
        try {
          await fs.rmdir(outputFolder, { recursive: true });
        } catch (e) {
          // ignore cleanup error
        }
        reject(err);
      })
      .screenshots({
        count: 0,
        timemarks,
        folder: outputFolder,
        filename: 'frame-%i.jpg',
        size: '1280x720',
      });
  }

  async processVideo(videoFile: Express.Multer.File): Promise<string[]> {
    // Upload video to storage
    const videoFileName = `videos/${Date.now()}-${videoFile.originalname}`;
    const fileName = await this.storageService.uploadFile(videoFile, videoFileName);

    const videoLink = await this.storageService.getFileUrl(fileName);
    
    // Download the complete video file
    const videoPath = await this.downloadVideo(videoLink);
    let folder: string | undefined;

    try {
      // Extract frames from the complete video file
      const result = await this.extractFrames(videoPath);
      folder = result.folder;
      const { frameFileNames } = result;

      // Upload frames to storage
      const timestamps = Date.now();
      const uploadedFramePayloads: UploadFileDto[] = [];
      
      for (let i = 0; i < frameFileNames.length; i++) {
        const frameName = frameFileNames[i];
        const frameBuffer = await this.readFileBuffer(path.join(folder, frameName));
        const frameFileName = `frames/${timestamps}-${frameName}`;
        uploadedFramePayloads.push({ 
          file: { 
            buffer: frameBuffer, 
            originalname: frameName, 
            mimetype: 'image/jpeg', 
            size: frameBuffer.length 
          } as Express.Multer.File, 
          fileName: frameFileName 
        });
      }

      return await this.storageService.uploadFiles(uploadedFramePayloads);
    } finally {
      try {
        await fs.unlink(videoPath);
        if (folder) {
          await fs.rmdir(folder, { recursive: true });
        }
      } catch (e) {
        console.warn('Failed to clean up temporary files:', e);
      }
    }
  }

  private async readFileBuffer(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  private async downloadVideo(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const videoPath = path.join(os.tmpdir(), `video-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);
    const fileStream = await fs.open(videoPath, 'w');
    
    try {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        await fileStream.write(value);
      }
    } finally {
      await fileStream.close();
    }

    return videoPath;
  }
} 