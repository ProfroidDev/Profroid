FROM node:22-alpine AS build
WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_BACKEND_URL
ARG VITE_API_URL
ARG VITE_ENV

# Set environment variables from build args
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_ENV=${VITE_ENV}

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Production Image ---
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Add our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
