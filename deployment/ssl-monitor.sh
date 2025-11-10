#!/bin/sh

# SSL Certificate Monitoring Script
# Checks certificate expiry and sends alerts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
CERT_FILE="/ssl/ssl.crt"
ALERT_DAYS=${ALERT_DAYS:-30}
WEBHOOK_URL=${WEBHOOK_URL:-}

print_status() {
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    if [ "$2" = "SUCCESS" ]; then
        echo -e "${GREEN}[$timestamp] ✅ $1${NC}"
    elif [ "$2" = "WARNING" ]; then
        echo -e "${YELLOW}[$timestamp] ⚠️  $1${NC}"
    elif [ "$2" = "ERROR" ]; then
        echo -e "${RED}[$timestamp] ❌ $1${NC}"
    else
        echo "[$timestamp] ℹ️  $1"
    fi
}

send_alert() {
    local message="$1"
    local level="$2"
    
    print_status "$message" "$level"
    
    # Send to webhook if configured
    if [ -n "$WEBHOOK_URL" ]; then
        case $level in
            "ERROR")
                color="#ff0000"
                emoji="🚨"
                ;;
            "WARNING")
                color="#ffa500"
                emoji="⚠️"
                ;;
            *)
                color="#00ff00"
                emoji="ℹ️"
                ;;
        esac
        
        payload=$(cat <<EOF
{
  "text": "$emoji WhatsDeX SSL Alert",
  "attachments": [
    {
      "color": "$color",
      "fields": [
        {
          "title": "SSL Certificate Status",
          "value": "$message",
          "short": false
        },
        {
          "title": "Server",
          "value": "$(hostname)",
          "short": true
        },
        {
          "title": "Timestamp",
          "value": "$(date)",
          "short": true
        }
      ]
    }
  ]
}
EOF
        )
        
        # Send webhook notification
        if command -v curl >/dev/null 2>&1; then
            curl -X POST -H 'Content-type: application/json' \
                --data "$payload" \
                "$WEBHOOK_URL" >/dev/null 2>&1 || true
        elif command -v wget >/dev/null 2>&1; then
            wget --quiet --post-data="$payload" \
                --header="Content-Type: application/json" \
                "$WEBHOOK_URL" -O /dev/null || true
        fi
    fi
}

check_certificate() {
    if [ ! -f "$CERT_FILE" ]; then
        send_alert "SSL certificate file not found: $CERT_FILE" "ERROR"
        return 1
    fi
    
    # Check if certificate is valid
    if ! openssl x509 -in "$CERT_FILE" -noout -checkend 0 >/dev/null 2>&1; then
        send_alert "SSL certificate has expired!" "ERROR"
        return 1
    fi
    
    # Get certificate details
    subject=$(openssl x509 -in "$CERT_FILE" -noout -subject | sed 's/subject=//')
    issuer=$(openssl x509 -in "$CERT_FILE" -noout -issuer | sed 's/issuer=//')
    not_after=$(openssl x509 -in "$CERT_FILE" -noout -enddate | sed 's/notAfter=//')
    
    # Calculate days until expiry
    exp_date=$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)
    exp_epoch=$(date -d "$exp_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$exp_date" +%s 2>/dev/null)
    now_epoch=$(date +%s)
    days_left=$(( (exp_epoch - now_epoch) / 86400 ))
    
    print_status "Certificate subject: $subject" "INFO"
    print_status "Certificate issuer: $issuer" "INFO"
    print_status "Expires: $not_after" "INFO"
    print_status "Days until expiry: $days_left" "INFO"
    
    # Check expiry warnings
    if [ "$days_left" -le 7 ]; then
        send_alert "SSL certificate expires in $days_left days! Urgent renewal required." "ERROR"
    elif [ "$days_left" -le "$ALERT_DAYS" ]; then
        send_alert "SSL certificate expires in $days_left days. Consider renewal." "WARNING"
    else
        print_status "SSL certificate is valid for $days_left more days" "SUCCESS"
    fi
    
    # Check certificate chain if CA bundle exists
    if [ -f "/ssl/ca-bundle.crt" ]; then
        if openssl verify -CAfile "/ssl/ca-bundle.crt" "$CERT_FILE" >/dev/null 2>&1; then
            print_status "Certificate chain verification: PASSED" "SUCCESS"
        else
            send_alert "Certificate chain verification: FAILED" "WARNING"
        fi
    fi
    
    # Check private key match if key exists
    if [ -f "/ssl/ssl.key" ]; then
        cert_hash=$(openssl x509 -noout -modulus -in "$CERT_FILE" | openssl md5 | cut -d' ' -f2)
        key_hash=$(openssl rsa -noout -modulus -in "/ssl/ssl.key" 2>/dev/null | openssl md5 | cut -d' ' -f2)
        
        if [ "$cert_hash" = "$key_hash" ]; then
            print_status "Certificate and private key: MATCH" "SUCCESS"
        else
            send_alert "Certificate and private key: DO NOT MATCH" "ERROR"
        fi
    fi
}

# Main monitoring function
main() {
    print_status "Starting SSL certificate monitoring" "INFO"
    print_status "Alert threshold: $ALERT_DAYS days" "INFO"
    
    if [ -n "$WEBHOOK_URL" ]; then
        print_status "Webhook notifications enabled" "INFO"
    else
        print_status "Webhook notifications disabled" "INFO"
    fi
    
    check_certificate
    
    print_status "SSL monitoring check completed" "INFO"
}

# Run main function
main