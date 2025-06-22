import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { initial } = params;
  const letter = (initial || 'U').toUpperCase().charAt(0);
  
  // Generate a simple SVG avatar with the initial
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  const colorIndex = letter.charCodeAt(0) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="${backgroundColor}"/>
      <text x="20" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
            text-anchor="middle" fill="white">${letter}</text>
    </svg>
  `;
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
}