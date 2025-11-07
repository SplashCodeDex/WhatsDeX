#!/bin/bash

# Self-Signed SSL Certificate Generator for WhatsDeX
# For development and testing purposes only

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

echo -e "${BLUE}🔒 Self-Signed SSL Certificate Generator${NC}"
echo "========================================"

# Check if domain is provided
if [ -z "$1" ]; then
    print_status "Usage: $0 <domain>" "ERROR"
    echo "Example: $0 localhost"
    echo "Example: $0 dev.whatsdex.local"
    exit 1
fi

DOMAIN="$1"
print_status "Generating self-signed certificate for: $DOMAIN" "INFO"

# Warning about self-signed certificates
print_status "⚠️  WARNING: Self-signed certificates are for development only!" "WARNING"
print_status "Browsers will show security warnings" "WARNING"
print_status "Use Let's Encrypt for production deployments" "WARNING"

echo
read -p "Continue with self-signed certificate generation? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Certificate generation cancelled" "INFO"
    exit 0
fi

# Create SSL configuration
cat > ssl.conf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=Development
L=Development
O=WhatsDeX Development
OU=Development Team
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = *.${DOMAIN}
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate private key
echo -e "\n1. Generating private key..."
openssl genrsa -out ssl.key 2048
print_status "Private key generated" "SUCCESS"

# Generate certificate
echo -e "\n2. Generating certificate..."
openssl req -new -x509 -key ssl.key -out ssl.crt -days 365 -config ssl.conf -extensions v3_req
print_status "Certificate generated (valid for 365 days)" "SUCCESS"

# Generate DH parameters
echo -e "\n3. Generating DH parameters..."
if [ ! -f "dhparam.pem" ]; then
    print_status "Generating 2048-bit DH parameters..." "INFO"
    openssl dhparam -out dhparam.pem 2048
    print_status "DH parameters generated" "SUCCESS"
else
    print_status "DH parameters already exist" "SUCCESS"
fi

# Set permissions
chmod 600 ssl.key
chmod 644 ssl.crt dhparam.pem
print_status "File permissions set" "SUCCESS"

# Clean up
rm ssl.conf

# Verify certificate
echo -e "\n4. Verifying certificate..."
echo "📋 Certificate details:"
openssl x509 -in ssl.crt -noout -subject -issuer -dates
print_status "Certificate verification complete" "SUCCESS"

# Create certificate info script
cat > check-certificates.sh << 'EOF'
#!/bin/bash

echo "🔍 Certificate Status Check"
echo "=========================="

if [ -f "ssl.crt" ]; then
    echo "📋 Certificate Information:"
    openssl x509 -in ssl.crt -noout -subject -issuer -dates
    
    echo -e "\n🕐 Days until expiry:"
    openssl x509 -in ssl.crt -noout -checkend 86400 && echo "✅ Certificate valid for >1 day" || echo "⚠️  Certificate expires within 24 hours"
    openssl x509 -in ssl.crt -noout -checkend 604800 && echo "✅ Certificate valid for >1 week" || echo "⚠️  Certificate expires within 1 week"
    openssl x509 -in ssl.crt -noout -checkend 2592000 && echo "✅ Certificate valid for >1 month" || echo "⚠️  Certificate expires within 1 month"
    
    echo -e "\n🔍 Certificate Details:"
    openssl x509 -in ssl.crt -noout -text | grep -A1 "Subject Alternative Name"
else
    echo "❌ No SSL certificate found"
fi
EOF

chmod +x check-certificates.sh

echo -e "\n${GREEN}🎉 Self-Signed Certificate Generated!${NC}"
echo "====================================="
print_status "Certificate created for: $DOMAIN" "SUCCESS"
print_status "Valid for: 365 days" "SUCCESS"
print_status "Files created: ssl.crt, ssl.key, dhparam.pem" "SUCCESS"

echo -e "\n📋 Next Steps:"
echo "1. Deploy with: docker-compose -f production.docker-compose.yml up -d"
echo "2. Access via: https://$DOMAIN"
echo "3. Accept browser security warning"
echo "4. For production, replace with Let's Encrypt certificate"

echo -e "\n⚠️  Important Notes:"
echo "- This certificate will trigger browser warnings"
echo "- Only use for development/testing"
echo "- Replace with proper CA certificate for production"
echo "- Run ./setup-letsencrypt.sh for production certificates"

echo -e "\n🔧 Management Commands:"
echo "- Check status: ./check-certificates.sh"
echo "- View certificate: openssl x509 -in ssl.crt -noout -text"