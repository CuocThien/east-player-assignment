export interface UploadFileDto {
  file: Express.Multer.File;
  fileName: string;
}