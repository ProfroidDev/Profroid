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

# Install gettext (provides envsubst)
RUN apk add --no-cache gettext

# Add our custom nginx config template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

# Create entrypoint script
RUN printf '#!/bin/sh\nset -e\nenvsubst "$$AUTH_SERVICE_URL:$$API_SERVICE_URL" < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf\nexec nginx -g "daemon off;"\n' > /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
