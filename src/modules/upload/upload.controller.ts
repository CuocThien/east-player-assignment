import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from '../video/video.service';
import { AnalysisService } from '../analysis/analysis.service';
import { StorageService } from '../storage/storage.service';
import * as multer from 'multer';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly videoService: VideoService,
    private readonly analysisService: AnalysisService,
    private readonly storageService: StorageService,
  ) {}

  @Post('brand-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024 * 1024, // 15GB in bytes
      },
    }),
  )
  async uploadBrandImage(@UploadedFile() file: Express.Multer.File) {
    const fileName = `brand-images/${Date.now()}-${file.originalname}`;
    await this.storageService.uploadFile(file, fileName);
    return { fileName };
  }

  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024 * 1024, // 15GB in bytes
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('brandImageFileName') brandImageFileName: string,
  ) {
    // Process video and extract frames
    const frameFileNames = await this.videoService.processVideo(file);

    // Analyze frames for brand detection
    const analysisResult = await this.analysisService.analyzeVideoFrames(
      frameFileNames,
      brandImageFileName,
    );

    return {
      videoFileName: `videos/${Date.now()}-${file.originalname}`,
      frameFileNames,
      analysisResult,
    };
  }

  @Get('analysis/:videoFileName')
  async getAnalysis(
    @Param('videoFileName') videoFileName: string,
    @Body('brandImageFileName') brandImageFileName: string,
  ) {
    return {
      videoFileName,
      brandImageFileName,
      analysisResult: {
        totalExposureTime: 0,
        exposurePercentage: 0,
        frames: [],
      },
    };
  }
} 