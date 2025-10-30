# Use a Node.js 22 Alpine image as the base for the build stage
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund --prefer-offline || npm ci --only=production

# Copy the rest of the application code
COPY . .

# Use a minimal Node.js 22 Alpine image for the runtime stage
FROM node:22-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/. ./

# Install PM2 globally for process management
RUN npm install -g pm2

# Create a non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S whatsdex -u 1001 -G nodejs

# Switch to the non-root user
USER whatsdex

# Expose the port the bot service listens on
EXPOSE 3001

# Define the command to run the application with PM2
CMD ["pm2-runtime", "index.js", "--name", "whatsdex-bot"]
