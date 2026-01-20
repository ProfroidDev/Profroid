FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Production Image ---
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Install envsubst for template substitution
RUN apk add --no-cache bash

# Add our custom nginx config template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

# Create entrypoint script to substitute environment variables
RUN echo '#!/bin/bash\n\
envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
nginx -g "daemon off;"' > /docker-entrypoint.sh && \
chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
