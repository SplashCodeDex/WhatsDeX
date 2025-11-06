#!/bin/sh

# Nginx health check script
# Tests if nginx is responding properly

# Test nginx status
if ! pgrep nginx > /dev/null; then
    echo "Nginx process not running"
    exit 1
fi

# Test HTTP response
if ! curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Nginx not responding to HTTP requests"
    exit 1
fi

# Test configuration syntax
if ! nginx -t > /dev/null 2>&1; then
    echo "Nginx configuration has syntax errors"
    exit 1
fi

echo "Nginx health check passed"
exit 0