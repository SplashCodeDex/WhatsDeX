#!/bin/bash

# Diffie-Hellman Parameters Generator for Enhanced SSL Security

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    if [ "$2" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    elif [ "$2" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    elif [ "$2" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    else
        echo "📋 $1"
    fi
}

echo -e "${BLUE}🔐 DH Parameters Generator${NC}"
echo "=========================="

# Check if dhparam.pem already exists
if [ -f "dhparam.pem" ]; then
    print_status "DH parameters file already exists" "WARNING"
    echo "Current file info:"
    openssl dhparam -in dhparam.pem -noout -text | head -n 5
    
    echo
    read -p "Regenerate DH parameters? This will take several minutes (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Using existing DH parameters" "INFO"
        exit 0
    fi
fi

# Choose key size
echo "Select DH parameter key size:"
echo "1) 2048 bits (Recommended - fast generation, good security)"
echo "2) 3072 bits (Higher security - slower generation)"
echo "3) 4096 bits (Maximum security - very slow generation)"
echo
read -p "Enter choice (1-3) [1]: " choice
choice=${choice:-1}

case $choice in
    1)
        KEYSIZE=2048
        print_status "Using 2048-bit DH parameters (recommended)" "INFO"
        ;;
    2)
        KEYSIZE=3072
        print_status "Using 3072-bit DH parameters (high security)" "INFO"
        ;;
    3)
        KEYSIZE=4096
        print_status "Using 4096-bit DH parameters (maximum security)" "INFO"
        print_status "This may take 10-30 minutes depending on your system" "WARNING"
        ;;
    *)
        print_status "Invalid choice, using 2048-bit" "WARNING"
        KEYSIZE=2048
        ;;
esac

# Generate DH parameters
echo -e "\n🔄 Generating ${KEYSIZE}-bit DH parameters..."
print_status "This process ensures Perfect Forward Secrecy" "INFO"
print_status "Generation time: ~30 seconds for 2048-bit, longer for higher sizes" "INFO"

# Show progress
echo "Progress indicators:"
echo "- Dots (.) indicate computation progress"
echo "- Plus (+) indicates a potential prime number"
echo "- Asterisk (*) indicates a prime number found"

echo -e "\nStarting generation..."
START_TIME=$(date +%s)

openssl dhparam -out dhparam.pem $KEYSIZE

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

print_status "DH parameters generated in ${DURATION} seconds" "SUCCESS"

# Set proper permissions
chmod 644 dhparam.pem
print_status "File permissions set (644)" "SUCCESS"

# Verify the generated parameters
echo -e "\n🔍 Verifying generated parameters..."
if openssl dhparam -in dhparam.pem -check -noout; then
    print_status "DH parameters verification successful" "SUCCESS"
else
    print_status "DH parameters verification failed" "ERROR"
    exit 1
fi

# Show parameter info
echo -e "\n📋 Parameter Information:"
openssl dhparam -in dhparam.pem -noout -text | head -n 5

echo -e "\n${GREEN}🎉 DH Parameters Generated Successfully!${NC}"
echo "======================================="
print_status "File: dhparam.pem" "SUCCESS"
print_status "Size: ${KEYSIZE} bits" "SUCCESS"
print_status "Security: Perfect Forward Secrecy enabled" "SUCCESS"

echo -e "\n📚 What are DH Parameters?"
echo "Diffie-Hellman parameters enable Perfect Forward Secrecy (PFS)"
echo "PFS ensures that even if your private key is compromised,"
echo "past encrypted communications remain secure."

echo -e "\n🔧 Usage:"
echo "These parameters are automatically used by nginx when you deploy"
echo "with SSL certificates. No additional configuration needed."

echo -e "\n⏰ Recommendations:"
echo "- Regenerate DH parameters every 6-12 months"
echo "- Use 2048-bit for most applications"
echo "- Use 3072+ bit for high-security environments"