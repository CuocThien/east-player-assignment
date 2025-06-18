import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { VideoModule } from '../video/video.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [VideoModule, AnalysisModule, StorageModule],
  controllers: [UploadController],
  providers: [],
})
export class UploadModule {} 