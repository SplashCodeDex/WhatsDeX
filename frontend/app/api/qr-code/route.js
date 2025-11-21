// Enhanced QR Code API endpoint for cloud deployments
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request) {
  try {
    // This would connect to your bot service to get the current QR
    // For now, we'll create a placeholder
    
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, png, svg
    const userId = searchParams.get('userId') || 'default';
    
    // In production, this would fetch from your WhatsApp service
    const qrString = 'https://wa.me/qr/SAMPLE_QR_CODE_FOR_DEMO';
    
    if (format === 'png') {
      // Return QR as PNG image
      const qrBuffer = await QRCode.toBuffer(qrString, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return new NextResponse(qrBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Expires': '0'
        }
      });
    }
    
    if (format === 'svg') {
      // Return QR as SVG
      const qrSvg = await QRCode.toString(qrString, { type: 'svg' });
      return new NextResponse(qrSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }
    
    // Default: Return JSON with QR data
    return NextResponse.json({
      success: true,
      qrCode: qrString,
      qrImage: await QRCode.toDataURL(qrString),
      expiresIn: 90, // seconds
      timestamp: new Date().toISOString(),
      userId,
      instructions: [
        'Open WhatsApp on your phone',
        'Tap Menu (⋮) > Linked Devices',
        'Tap "Link a Device"', 
        'Scan this QR code'
      ]
    });
    
  } catch (error) {
    console.error('QR Code API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate QR code',
      message: error.message
    }, { status: 500 });
  }
}