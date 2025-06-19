# Project Documentation

This project provides an API for uploading images and videos, extracting video frames, and storing files using a MinIO backend. Below are step-by-step instructions for setting up the project and using the API endpoints.

---

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Uploading an Image](#uploading-an-image)
- [Uploading a Video](#uploading-a-video)
- [Postman Collection](#postman-collection)
- [Notes](#notes)

---

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/CuocThien/east-player-assignment.git
   cd east-player-assignment
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create a .env file**
   ```bash
   cp .env.example .env
   ```

3. **Start MinIO and Backend using Docker Compose**
   ```bash
   docker-compose up
   ```
   - MinIO will be available at [http://localhost:9001](http://localhost:9001) (default credentials: `minioadmin` / `minioadmin`).
   - Backend API will be available at [http://localhost:3000](http://localhost:3000).

4. **(Optional) Access MinIO Console**
   - Open [http://localhost:9001](http://localhost:9001) in your browser.
   - Login with the credentials above.

---

## Uploading an Image

1. **Open Postman.**
2. **Import the Public Postman Collection:**
   - [Postman Workspace Link](https://www.postman.com/planetary-satellite-308563/workspace/east-player)
3. **Select the `Upload brand image` Request** (or create a new POST request to `/api/upload/brand-image`).
4. **Set the Request:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/upload/brand-image`
   - Body: Select `form-data`
     - Key: `file` (Type: File)
     - Value: *Choose your image file*
5. **Send the Request.**
6. **Check the Response:**
   - You should receive a JSON response with the uploaded image URL.

---

## Uploading a Video

1. **Open Postman.**
2. **Import the Public Postman Collection:**
   - [Postman Workspace Link](https://www.postman.com/planetary-satellite-308563/workspace/east-player)
3. **Select the `Upload Video` Request** (or create a new POST request to `/api/upload/video`).
4. **Set the Request:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/upload/video`
   - Body: Select `form-data`
     - Key: `file` (Type: File)
     - Value: *Choose your video file (e.g., .mp4)*
     - Key: `brandImageFileName` (Type: String)
     - Value: *Use the brand image file name you received from the previous request*
5. **Send the Request.**
6. **Check the Response:**
   - You should receive a JSON response with URLs for the uploaded video and extracted frames.

---

## Postman Collection

- All API endpoints and example requests are available in the public Postman workspace:
  - [https://www.postman.com/planetary-satellite-308563/workspace/east-player](https://www.postman.com/planetary-satellite-308563/workspace/east-player)

---

## Notes

- Make sure Docker is running before starting the project.
- The backend service depends on MinIO for file storage.
- If you encounter issues with file uploads, check the backend logs and ensure MinIO is healthy.
- For advanced usage (e.g., programmatic access), refer to the API definitions in the Postman collection.

---

> **Note:**  
> Due to time constraints, the current implementation is not optimized for large files and may not provide the best performance when handling very large video uploads or processing. I plan to improve and optimize this in future updates.

