const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

// Simple rate limiter
const rateLimiters = {};
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // 100 requests

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  if (!rateLimiters[ip]) {
    rateLimiters[ip] = { count: 0, start: Date.now() };
  }
  const limiter = rateLimiters[ip];
  const elapsed = Date.now() - limiter.start;
  
  if (elapsed > RATE_LIMIT_WINDOW) {
    limiter.count = 0;
    limiter.start = Date.now();
  }
  
  limiter.count++;
  if (limiter.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }
  
  next();
});

// Apply helmet AFTER the custom rate limiter
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
  }
}));
app.use((req, res, next) => {
  // HPP - Parameter pollution protection
  for (const key of Object.keys(req.query)) {
    if (req.query[key].includes('..') || req.query[key].includes('||') || req.query[key].includes('&&')) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
  }
  next();
});

// CORS
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));

// Input sanitization
app.use((req, res, next) => {
  if (req.body) {
    req.body = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [key, typeof value === 'string' ? value.replace(/[<>'"&]/g, '') : value])
    );
  }
  next();
});

// ... rest