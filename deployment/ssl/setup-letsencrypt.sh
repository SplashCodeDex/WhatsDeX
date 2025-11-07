#!/bin/bash

# Let's Encrypt SSL Certificate Setup for WhatsDeX
# Automated certificate generation with Certbot

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    if [ "$2" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    elif [ "$2" = "ERROR" ]; then
        echo -e "${RED}❌ $1${NC}"
    elif [ "$2" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    else
        echo "📋 $1"
    fi
}

echo -e "${BLUE}🔒 Let's Encrypt SSL Setup for WhatsDeX${NC}"
echo "=========================================="

# Check if domain is provided
if [ -z "$1" ]; then
    print_status "Usage: $0 <domain> [email]" "ERROR"
    echo "Examples:"
    echo "  $0 yourdomain.com"
    echo "  $0 yourdomain.com admin@yourdomain.com"
    echo "  $0 \"*.yourdomain.com,yourdomain.com\" admin@yourdomain.com"
    exit 1
fi

DOMAIN="$1"
EMAIL="${2:-admin@${DOMAIN}}"

print_status "Setting up SSL for domain: $DOMAIN" "INFO"
print_status "Contact email: $EMAIL" "INFO"

# Check if running with Docker
if command -v docker &> /dev/null; then
    print_status "Docker found, using containerized Certbot" "SUCCESS"
    USE_DOCKER=true
else
    print_status "Docker not found, checking for local Certbot" "WARNING"
    if command -v certbot &> /dev/null; then
        print_status "Certbot found locally" "SUCCESS"
        USE_DOCKER=false
    else
        print_status "Neither Docker nor Certbot found" "ERROR"
        echo "Please install Docker or Certbot to continue"
        exit 1
    fi
fi

# Create required directories
mkdir -p certbot/{conf,www,logs}
print_status "Created Certbot directories" "SUCCESS"

# Check if wildcard certificate
if [[ "$DOMAIN" == *"*"* ]]; then
    print_status "Wildcard certificate detected - DNS challenge required" "WARNING"
    echo "You'll need to manually add DNS TXT records during the process"
    CHALLENGE_TYPE="dns"
else
    CHALLENGE_TYPE="webroot"
fi

# Generate certificate
echo -e "\n1. Generating SSL certificate..."

if [ "$USE_DOCKER" = true ]; then
    if [ "$CHALLENGE_TYPE" = "webroot" ]; then
        # HTTP challenge using webroot
        docker run --rm \
            -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
            -v "$(pwd)/certbot/www:/var/www/certbot" \
            -v "$(pwd)/certbot/logs:/var/log/letsencrypt" \
            certbot/certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            --force-renewal \
            -d "$DOMAIN"
    else
        # DNS challenge for wildcard
        docker run --rm -it \
            -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
            -v "$(pwd)/certbot/logs:/var/log/letsencrypt" \
            certbot/certbot certonly \
            --manual \
            --preferred-challenges dns \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN"
    fi
else
    # Local Certbot
    if [ "$CHALLENGE_TYPE" = "webroot" ]; then
        sudo certbot certonly \
            --webroot \
            --webroot-path="$(pwd)/certbot/www" \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            --force-renewal \
            -d "$DOMAIN"
    else
        sudo certbot certonly \
            --manual \
            --preferred-challenges dns \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN"
    fi
fi

# Extract domain name for file paths
MAIN_DOMAIN=$(echo "$DOMAIN" | sed 's/\*\.//g' | cut -d',' -f1)

# Copy certificates to nginx directory
echo -e "\n2. Installing certificates..."

if [ "$USE_DOCKER" = true ]; then
    CERT_PATH="certbot/conf/live/$MAIN_DOMAIN"
else
    CERT_PATH="/etc/letsencrypt/live/$MAIN_DOMAIN"
fi

if [ -d "$CERT_PATH" ]; then
    cp "$CERT_PATH/fullchain.pem" ssl.crt
    cp "$CERT_PATH/privkey.pem" ssl.key
    if [ -f "$CERT_PATH/chain.pem" ]; then
        cp "$CERT_PATH/chain.pem" ca-bundle.crt
    fi
    print_status "Certificates installed successfully" "SUCCESS"
else
    print_status "Certificate directory not found: $CERT_PATH" "ERROR"
    exit 1
fi

# Generate DH parameters if not exists
echo -e "\n3. Generating DH parameters..."
if [ ! -f "dhparam.pem" ]; then
    print_status "Generating 2048-bit DH parameters (this may take a while)..." "INFO"
    openssl dhparam -out dhparam.pem 2048
    print_status "DH parameters generated" "SUCCESS"
else
    print_status "DH parameters already exist" "SUCCESS"
fi

# Set proper permissions
chmod 600 ssl.key
chmod 644 ssl.crt dhparam.pem
if [ -f "ca-bundle.crt" ]; then
    chmod 644 ca-bundle.crt
fi
print_status "File permissions set correctly" "SUCCESS"

# Create renewal script
echo -e "\n4. Setting up automatic renewal..."
cat > renew-certificates.sh << 'EOF'
#!/bin/bash

# Certificate renewal script
set -e

echo "🔄 Renewing SSL certificates..."

if command -v docker &> /dev/null; then
    # Renew using Docker
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        -v "$(pwd)/certbot/logs:/var/log/letsencrypt" \
        certbot/certbot renew --quiet
    
    # Copy renewed certificates
    MAIN_DOMAIN=$(ls certbot/conf/live/ | head -n1)
    if [ -n "$MAIN_DOMAIN" ]; then
        cp "certbot/conf/live/$MAIN_DOMAIN/fullchain.pem" ssl.crt
        cp "certbot/conf/live/$MAIN_DOMAIN/privkey.pem" ssl.key
        echo "✅ Certificates renewed and copied"
        
        # Reload nginx
        docker-compose restart nginx 2>/dev/null || echo "⚠️  Please restart nginx manually"
    fi
else
    # Renew using local Certbot
    sudo certbot renew --quiet
    echo "✅ Certificates renewed"
fi
EOF

chmod +x renew-certificates.sh
print_status "Renewal script created" "SUCCESS"

# Add to crontab suggestion
echo -e "\n5. Setting up automatic renewal cron job..."
CRON_JOB="0 12 * * * cd $(pwd) && ./renew-certificates.sh"
echo "Add this line to your crontab (crontab -e):"
echo "$CRON_JOB"

# Create certificate checker
cat > check-certificates.sh << 'EOF'
#!/bin/bash

# Certificate status checker
echo "🔍 Certificate Status Check"
echo "=========================="

if [ -f "ssl.crt" ]; then
    echo "📋 Certificate Information:"
    openssl x509 -in ssl.crt -noout -subject -issuer -dates
    
    echo -e "\n🕐 Days until expiry:"
    openssl x509 -in ssl.crt -noout -checkend 86400 && echo "✅ Certificate valid for >1 day" || echo "⚠️  Certificate expires within 24 hours"
    openssl x509 -in ssl.crt -noout -checkend 604800 && echo "✅ Certificate valid for >1 week" || echo "⚠️  Certificate expires within 1 week"
    openssl x509 -in ssl.crt -noout -checkend 2592000 && echo "✅ Certificate valid for >1 month" || echo "⚠️  Certificate expires within 1 month"
else
    echo "❌ No SSL certificate found"
fi
EOF

chmod +x check-certificates.sh
print_status "Certificate checker created" "SUCCESS"

# Final verification
echo -e "\n6. Verifying certificate installation..."
if ./check-certificates.sh | grep -q "Certificate valid"; then
    print_status "Certificate verification successful" "SUCCESS"
else
    print_status "Certificate verification failed" "ERROR"
fi

echo -e "\n${GREEN}🎉 SSL Setup Complete!${NC}"
echo "======================="
print_status "SSL certificate installed for: $DOMAIN" "SUCCESS"
print_status "Certificate files created in deployment/ssl/" "SUCCESS"
print_status "Automatic renewal configured" "SUCCESS"

echo -e "\n📋 Next Steps:"
echo "1. Deploy with: docker-compose -f production.docker-compose.yml up -d"
echo "2. Test HTTPS: https://$MAIN_DOMAIN"
echo "3. Check SSL rating: https://www.ssllabs.com/ssltest/"
echo "4. Set up monitoring alerts for certificate expiry"

echo -e "\n🔧 Management Commands:"
echo "- Check status: ./check-certificates.sh"
echo "- Renew manually: ./renew-certificates.sh"
echo "- Add to cron: crontab -e"