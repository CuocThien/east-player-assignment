import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AnalysisService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('openai.apiKey'),
    });
  }

  async analyzeImage(imageFileName: string, brandImageFileName: string): Promise<{
    detected: boolean;
    confidence: number;
    timestamp: number;
  }> {
    const imageUrl = await this.storageService.getFileUrl(imageFileName);
    const brandImageUrl = await this.storageService.getFileUrl(brandImageFileName);

    // Mock OpenAI API call for brand detection
    const response = await this.mockOpenAIAnalysis(imageUrl, brandImageUrl);

    return {
      detected: response.detected,
      confidence: response.confidence,
      timestamp: Date.now(),
    };
  }

  private async mockOpenAIAnalysis(
    imageUrl: string,
    brandImageUrl: string,
  ): Promise<{ detected: boolean; confidence: number }> {
    // This is a mock implementation
    return {
      detected: Math.random() > 0.5,
      confidence: Math.random(),
    };
  }

  async analyzeVideoFrames(
    frameFileNames: string[],
    brandImageFileName: string,
  ): Promise<{
    totalExposureTime: number;
    exposurePercentage: number;
    frames: Array<{
      timestamp: number;
      detected: boolean;
      confidence: number;
    }>;
  }> {
    const analysisResults = await Promise.all(
      frameFileNames.map(async (frameFileName) => {
        const result = await this.analyzeImage(frameFileName, brandImageFileName);
        return {
          timestamp: result.timestamp,
          detected: result.detected,
          confidence: result.confidence,
        };
      }),
    );

    const detectedFrames = analysisResults.filter((result) => result.detected);
    const totalExposureTime = detectedFrames.length * 10; // 10 seconds per frame
    const exposurePercentage = (detectedFrames.length / frameFileNames.length) * 100;

    return {
      totalExposureTime,
      exposurePercentage,
      frames: analysisResults,
    };
  }
} 