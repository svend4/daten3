#!/usr/bin/env node
/**
 * Mock Backend Server for Testing
 * Provides minimal endpoints to test frontend-backend connection
 */

const http = require('http');
const url = require('url');

const PORT = 3000;

// Mock CSRF token
const CSRF_TOKEN = 'mock-csrf-token-' + Date.now();

// Simple router
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // Routes
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'TravelHub Ultimate API (Mock)',
      version: '1.0.0',
      status: 'running',
      documentation: '/api-docs',
      endpoints: {
        health: '/api/health',
        csrf: '/api/auth/csrf-token',
      }
    }));
  }
  else if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: 'mock'
    }));
  }
  else if (pathname === '/api/auth/csrf-token') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        csrfToken: CSRF_TOKEN
      }
    }));
  }
  else if (pathname === '/api-docs.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'TravelHub Mock API',
        version: '1.0.0',
        description: 'Mock API for testing'
      },
      paths: {}
    }));
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      path: pathname
    }));
  }
}

// Create server
const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('  🚀 Mock Backend Server Started');
  console.log('='.repeat(60));
  console.log(`  Port: ${PORT}`);
  console.log(`  Environment: Mock/Testing`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('');
  console.log('  Available Endpoints:');
  console.log('  - GET  /                     (API info)');
  console.log('  - GET  /api/health           (Health check)');
  console.log('  - GET  /api/auth/csrf-token  (CSRF token)');
  console.log('  - GET  /api-docs.json        (API docs)');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down mock server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down mock server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});
