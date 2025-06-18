export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  minio: {
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
}); 