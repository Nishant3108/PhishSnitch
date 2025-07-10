# Use official Node image as build environment
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all source files
COPY . .

# Build the React app for production
RUN npm run build

# Use nginx to serve the built app
FROM nginx:stable-alpine

# Copy build output to nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]
