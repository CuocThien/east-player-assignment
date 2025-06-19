FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock (or package-lock.json)
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN yarn install || npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables (can be overridden by docker-compose)
ENV NODE_ENV=development

# Start the application
CMD ["yarn", "start:dev"]
