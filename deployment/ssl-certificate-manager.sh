#!/bin/bash

# WhatsDeX SSL Certificate Manager
# Comprehensive SSL certificate management tool

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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
    elif [ "$2" = "HEADER" ]; then
        echo -e "${PURPLE}🔷 $1${NC}"
    else
        echo "📋 $1"
    fi
}

show_banner() {
    echo -e "${BLUE}"
    echo "██╗    ██╗██╗  ██╗ █████╗ ████████╗███████╗██████╗ ███████╗██╗  ██╗"
    echo "██║    ██║██║  ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔════╝╚██╗██╔╝"
    echo "██║ █╗ ██║███████║███████║   ██║   ███████╗██║  ██║█████╗   ╚███╔╝ "
    echo "██║███╗██║██╔══██║██╔══██║   ██║   ╚════██║██║  ██║██╔══╝   ██╔██╗ "
    echo "╚███╔███╔╝██║  ██║██║  ██║   ██║   ███████║██████╔╝███████╗██╔╝ ██╗"
    echo " ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝"
    echo -e "${NC}"
    echo -e "${PURPLE}🔒 SSL Certificate Manager${NC}"
    echo "=========================="
}

show_menu() {
    echo
    print_status "Select an option:" "HEADER"
    echo "1. 🆕 Setup new certificates"
    echo "2. 🔄 Renew existing certificates"
    echo "3. 🔍 Check certificate status"
    echo "4. 🗑️  Remove certificates"
    echo "5. 🔧 Configure automatic renewal"
    echo "6. 🧪 Test SSL configuration"
    echo "7. 📊 Generate SSL report"
    echo "8. ❓ Help & documentation"
    echo "9. 🚪 Exit"
    echo
}

setup_certificates() {
    print_status "Certificate Setup Options" "HEADER"
    echo "1. Let's Encrypt (Recommended for production)"
    echo "2. Self-signed (Development only)"
    echo "3. Import existing certificates"
    echo
    read -p "Choose setup method (1-3): " setup_choice
    
    case $setup_choice in
        1)
            echo
            read -p "Enter your domain (e.g., example.com): " domain
            read -p "Enter your email: " email
            cd ssl && ./setup-letsencrypt.sh "$domain" "$email"
            ;;
        2)
            echo
            read -p "Enter domain for self-signed cert (e.g., localhost): " domain
            cd ssl && ./generate-selfsigned.sh "$domain"
            ;;
        3)
            echo
            print_status "Place your certificate files in deployment/ssl/" "INFO"
            echo "Required files:"
            echo "- ssl.crt (your certificate)"
            echo "- ssl.key (private key)"
            echo "- ca-bundle.crt (CA bundle, optional)"
            echo
            read -p "Press Enter when files are ready..."
            if [ -f "ssl/ssl.crt" ] && [ -f "ssl/ssl.key" ]; then
                cd ssl && ./generate-dhparam.sh
                print_status "Certificates imported successfully" "SUCCESS"
            else
                print_status "Required certificate files not found" "ERROR"
            fi
            ;;
        *)
            print_status "Invalid choice" "ERROR"
            ;;
    esac
}

renew_certificates() {
    print_status "Certificate Renewal" "HEADER"
    
    if [ -f "ssl/renew-certificates.sh" ]; then
        cd ssl && ./renew-certificates.sh
        print_status "Certificate renewal completed" "SUCCESS"
    else
        print_status "No renewal script found" "ERROR"
        print_status "Certificates may not be from Let's Encrypt" "INFO"
    fi
}

check_certificates() {
    print_status "Certificate Status Check" "HEADER"
    
    if [ -f "ssl/check-certificates.sh" ]; then
        cd ssl && ./check-certificates.sh
    else
        # Manual check
        if [ -f "ssl/ssl.crt" ]; then
            echo "📋 Certificate Information:"
            openssl x509 -in ssl/ssl.crt -noout -subject -issuer -dates
            
            echo -e "\n🕐 Expiry Check:"
            if openssl x509 -in ssl/ssl.crt -noout -checkend 2592000; then
                print_status "Certificate valid for >30 days" "SUCCESS"
            else
                print_status "Certificate expires within 30 days!" "WARNING"
            fi
        else
            print_status "No SSL certificates found" "ERROR"
        fi
    fi
}

remove_certificates() {
    print_status "Certificate Removal" "WARNING"
    print_status "This will remove all SSL certificates and disable HTTPS" "WARNING"
    
    echo
    read -p "Are you sure you want to remove all certificates? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f ssl/ssl.crt ssl/ssl.key ssl/ca-bundle.crt ssl/dhparam.pem
        rm -f ssl/renew-certificates.sh ssl/check-certificates.sh
        print_status "All certificates removed" "SUCCESS"
        print_status "HTTPS is now disabled" "WARNING"
    else
        print_status "Certificate removal cancelled" "INFO"
    fi
}

configure_auto_renewal() {
    print_status "Automatic Renewal Configuration" "HEADER"
    
    if [ -f "ssl/renew-certificates.sh" ]; then
        SCRIPT_PATH="$(pwd)/ssl/renew-certificates.sh"
        CRON_JOB="0 2 * * * cd $(pwd)/ssl && ./renew-certificates.sh >> /var/log/ssl-renewal.log 2>&1"
        
        echo "Suggested crontab entry (runs daily at 2 AM):"
        echo "$CRON_JOB"
        echo
        read -p "Add this to your crontab? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
            print_status "Automatic renewal configured" "SUCCESS"
        else
            echo "Manual crontab setup:"
            echo "1. Run: crontab -e"
            echo "2. Add: $CRON_JOB"
        fi
    else
        print_status "No renewal script found - only available for Let's Encrypt" "ERROR"
    fi
}

test_ssl_config() {
    print_status "SSL Configuration Test" "HEADER"
    
    if [ ! -f "ssl/ssl.crt" ]; then
        print_status "No SSL certificate found" "ERROR"
        return
    fi
    
    echo "🔍 Testing SSL certificate..."
    
    # Check certificate validity
    if openssl x509 -in ssl/ssl.crt -noout -checkend 0; then
        print_status "Certificate is currently valid" "SUCCESS"
    else
        print_status "Certificate has expired!" "ERROR"
    fi
    
    # Check private key match
    CERT_HASH=$(openssl x509 -noout -modulus -in ssl/ssl.crt | openssl md5)
    KEY_HASH=$(openssl rsa -noout -modulus -in ssl/ssl.key | openssl md5)
    
    if [ "$CERT_HASH" = "$KEY_HASH" ]; then
        print_status "Certificate and private key match" "SUCCESS"
    else
        print_status "Certificate and private key do NOT match!" "ERROR"
    fi
    
    # Check DH parameters
    if [ -f "ssl/dhparam.pem" ]; then
        print_status "DH parameters present" "SUCCESS"
    else
        print_status "DH parameters missing - generating..." "WARNING"
        cd ssl && ./generate-dhparam.sh
    fi
    
    echo
    print_status "SSL test completed" "INFO"
}

generate_ssl_report() {
    print_status "SSL Configuration Report" "HEADER"
    
    REPORT_FILE="ssl-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "WhatsDeX SSL Configuration Report"
        echo "Generated: $(date)"
        echo "=================================="
        echo
        
        if [ -f "ssl/ssl.crt" ]; then
            echo "Certificate Information:"
            echo "----------------------"
            openssl x509 -in ssl/ssl.crt -noout -text
            echo
            
            echo "Certificate Chain:"
            echo "-----------------"
            openssl x509 -in ssl/ssl.crt -noout -subject -issuer
            echo
            
            echo "Expiry Information:"
            echo "------------------"
            openssl x509 -in ssl/ssl.crt -noout -dates
            echo
        else
            echo "No SSL certificate found."
            echo
        fi
        
        if [ -f "ssl/dhparam.pem" ]; then
            echo "DH Parameters:"
            echo "-------------"
            openssl dhparam -in ssl/dhparam.pem -noout -text | head -10
            echo
        fi
        
        echo "File Permissions:"
        echo "----------------"
        ls -la ssl/ 2>/dev/null || echo "SSL directory not found"
        
    } > "$REPORT_FILE"
    
    print_status "Report generated: $REPORT_FILE" "SUCCESS"
}

show_help() {
    print_status "SSL Certificate Manager Help" "HEADER"
    echo
    echo "📚 Certificate Types:"
    echo "• Let's Encrypt: Free, automated, trusted by all browsers"
    echo "• Self-signed: For development only, causes browser warnings"
    echo "• Commercial: Paid certificates from CAs like DigiCert, Comodo"
    echo
    echo "🔧 Common Tasks:"
    echo "• First setup: Use option 1 → Let's Encrypt"
    echo "• Development: Use option 1 → Self-signed"
    echo "• Check expiry: Use option 3"
    echo "• Auto-renewal: Use option 5 after Let's Encrypt setup"
    echo
    echo "📋 File Structure:"
    echo "deployment/ssl/"
    echo "├── ssl.crt          # Your certificate"
    echo "├── ssl.key          # Private key"
    echo "├── ca-bundle.crt    # CA bundle (optional)"
    echo "├── dhparam.pem      # DH parameters"
    echo "└── *.sh             # Management scripts"
    echo
    echo "🔒 Security Best Practices:"
    echo "• Use strong passwords for private keys"
    echo "• Set proper file permissions (600 for .key files)"
    echo "• Enable automatic renewal for Let's Encrypt"
    echo "• Monitor certificate expiry dates"
    echo "• Test SSL configuration regularly"
    echo
    echo "🌐 Online Tools:"
    echo "• SSL Labs Test: https://www.ssllabs.com/ssltest/"
    echo "• Certificate Decoder: https://www.sslshopper.com/certificate-decoder.html"
    echo
}

# Main script
show_banner

# Check if running in deployment directory
if [ ! -d "ssl" ]; then
    mkdir -p ssl
    print_status "Created ssl directory" "INFO"
fi

while true; do
    show_menu
    read -p "Enter your choice (1-9): " choice
    
    case $choice in
        1) setup_certificates ;;
        2) renew_certificates ;;
        3) check_certificates ;;
        4) remove_certificates ;;
        5) configure_auto_renewal ;;
        6) test_ssl_config ;;
        7) generate_ssl_report ;;
        8) show_help ;;
        9) 
            print_status "Goodbye!" "INFO"
            exit 0
            ;;
        *)
            print_status "Invalid choice. Please select 1-9." "ERROR"
            ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
done