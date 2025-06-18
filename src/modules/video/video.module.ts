import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {} 