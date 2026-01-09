FROM nginx:alpine-slim

#-----------------------INSTALL OPENSSL
RUN apk add --no-cache openssl

#-----------------------DOMAIN FOR SSL CERTIFICATE
# ARG DOMAIN=localhost
# ENV DOMAIN=${DOMAIN}

# #-----------------------GENERERATE AUTO-SIGNED CERTIFICATE 
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 \
        -out /etc/nginx/ssl/certificate.crt \
        -keyout /etc/nginx/ssl/private_key.key \
        -subj "/CN=localhost"

#-----------------------COPY NGINX CONFIG
COPY nginx.conf /etc/nginx/nginx.conf

#-----------------------EXPOSE HTTPS PORTS
EXPOSE 443

#-----------------------LAUNCH NGINX AS PID 1
CMD ["nginx", "-g", "daemon off;"]