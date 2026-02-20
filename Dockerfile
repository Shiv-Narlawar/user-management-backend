# Use official Node image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Build TypeScript -> dist
RUN npm run build

# Expose backend port
EXPOSE 7000

# Run migrations then start server
CMD ["sh", "-c", "npm run migration:run && node dist/src/server.js"]