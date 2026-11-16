
# Base image
FROM nginx:alpine

# Copy Angular production build
COPY www/ /usr/share/nginx/html/

# Expose application port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
COPY nginx.conf /etc/nginx/conf.d/default.conf
