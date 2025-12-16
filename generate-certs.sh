#!/bin/bash

SERVICES=("auth" "user" "game" "chat")

mkdir -p srcs/certs/ca
mkdir -p srcs/certs

# Clé de la CA
if [ ! -f srcs/certs/ca ]; then
openssl genrsa -out srcs/certs/ca.key 4096

# Certificat auto-signé de la CA
openssl req -x509 -new -nodes \
    -key srcs/certs/ca.key \
    -sha256 -days 3650 \
    -out srcs/certs/ca.pem \
    -subj "/C=FR/ST=Paris/L=Paris/O=Transcendence/OU=Dev/CN=transcendence.local"
fi


# Certificats par sevices
for service in "${SERVICES[@]}"; do

    echo "Generation certificate for $service..."

    mkdir -p srcs/certs/${service}

    openssl genrsa -out srcs/certs/${service}.key 2048

    # CSR
    openssl req -new \
      -key srcs/certs/$service.key \
      -out srcs/certs/$service.csr \
      -subj "/C=FR/ST=Paris/L=Paris/O=Transcendence/OU=$service/CN=$service"    
    # Certificat signé par la CA
    openssl x509 -req \
      -in srcs/certs/$service.csr \
      -CA srcs/certs/ca/ca.pem \
      -CAkey srcs/certs/ca/ca.key \
      -CAcreateserial \
      -out srcs/certs/$service.crt \
      -days 365 \
      -sha256   
    chmod 600 srcs/certs/$service.key
    chmod 644 srcs/certs/$service.crt

    # Nettoyage CSR
    rm srcs/certs/$service.csr"

done

echo "✅ All certificates generated and signed by CA!"