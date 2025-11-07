# 🔒 SSL Certificate Setup for WhatsDeX

This directory contains SSL certificates and configuration for HTTPS deployment.

## Certificate Files Required

Place your SSL certificates in this directory with these exact names:

```
deployment/ssl/
├── ssl.crt          # Your SSL certificate
├── ssl.key          # Your private key
├── ca-bundle.crt    # Certificate Authority bundle (optional)
└── dhparam.pem      # Diffie-Hellman parameters (auto-generated)
```

## Supported Certificate Sources

### 1. Let's Encrypt (Recommended - Free)
- ✅ Automatic renewal
- ✅ Wildcard support
- ✅ Easy setup with Certbot

### 2. Commercial CA (GoDaddy, Namecheap, etc.)
- ✅ Extended validation available
- ✅ Warranty included
- ⚠️ Manual renewal required

### 3. Self-Signed (Development Only)
- ✅ Quick setup for testing
- ❌ Browser warnings
- ❌ Not for production

## Quick Setup Commands

### Option A: Let's Encrypt (Recommended)
```bash
# Run the automated Let's Encrypt setup
./setup-letsencrypt.sh yourdomain.com

# For wildcard certificates
./setup-letsencrypt.sh "*.yourdomain.com,yourdomain.com"
```

### Option B: Commercial Certificate
```bash
# Upload your files to this directory
cp /path/to/your.crt ssl.crt
cp /path/to/your.key ssl.key
cp /path/to/ca-bundle.crt ca-bundle.crt  # if provided

# Generate DH parameters
./generate-dhparam.sh
```

### Option C: Self-Signed (Development)
```bash
# Generate self-signed certificate
./generate-selfsigned.sh yourdomain.com
```

## Security Features

- ✅ **TLS 1.3** support
- ✅ **HSTS** headers
- ✅ **Perfect Forward Secrecy**
- ✅ **Strong cipher suites**
- ✅ **OCSP stapling**
- ✅ **Certificate transparency**

## Nginx Configuration

The SSL configuration is automatically applied when certificates are present.

Key features:
- HTTP → HTTPS redirect
- Strong security headers
- Modern TLS configuration
- A+ SSL Labs rating

## Certificate Monitoring

The deployment includes automatic certificate monitoring:
- ✅ Expiry date checking
- ✅ Certificate validation
- ✅ Automatic renewal alerts
- ✅ Health check integration

## Troubleshooting

### Certificate Not Working
1. Check file permissions: `chmod 600 ssl.key && chmod 644 ssl.crt`
2. Verify certificate: `openssl x509 -in ssl.crt -text -noout`
3. Check nginx logs: `docker-compose logs nginx`

### Renewal Issues
1. Check Certbot logs: `docker-compose logs certbot`
2. Manual renewal: `./renew-certificates.sh`
3. Verify DNS configuration

## Commands Reference

| Command | Description |
|---------|-------------|
| `./setup-letsencrypt.sh` | Set up Let's Encrypt certificates |
| `./generate-selfsigned.sh` | Create self-signed certificates |
| `./generate-dhparam.sh` | Generate DH parameters |
| `./renew-certificates.sh` | Manually renew certificates |
| `./check-certificates.sh` | Validate certificate status |