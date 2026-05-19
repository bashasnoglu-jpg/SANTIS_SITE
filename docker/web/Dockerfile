FROM nginx:1.27-alpine

COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

# Copy only runtime-required public static files
COPY *.html ./
COPY tr/ ./tr/
COPY assets/ ./assets/
COPY components/ ./components/
COPY favicon.ico favicon.svg manifest.json robots.txt sitemap.xml ./
COPY santis-*.js service-worker.js sw.js ./
COPY santis_*.js ./
COPY routes.json _headers _redirects ./

# Adjust permissions for non-root runtime environment
RUN touch /var/run/nginx.pid \
  && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html /etc/nginx/conf.d

USER nginx

EXPOSE 8080


