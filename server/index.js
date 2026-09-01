import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import multer from 'multer';
import { RAGService } from './rag.js';
import {
  uploadPhoto,
  uploadOriginalPhoto,
  getOriginalPhoto,
  uploadPhotoMetadata,
  getPhotoMetadata,
  uploadPhotoAdminMetadata,
  getPhotoAdminMetadata,
  listPhotos,
  deletePhoto,
} from './photoStorage.js';
import { uploadVideo, listVideos, deleteVideo } from './videoStorage.js';

dotenv.config({ path: new URL('.env', import.meta.url).pathname });

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// API Configuration
const API_TIMEOUT_MS = 30000; // 30 second timeout for Claude API
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 20; // Max 20 requests per minute per IP

// CORS configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

function validateEnvironment() {
  const requiredVars = ['ANTHROPIC_API_KEY', 'BLOB_READ_WRITE_TOKEN', 'ADMIN_PASSWORD', 'RESEND_API_KEY', 'RESEND_EMAIL_DOMAIN'];
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please create a .env file with the required variables.');
    console.error('See .env.example for reference.');
    process.exit(1);
  }

  // Validate API key format (basic check)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey.startsWith('sk-ant-')) {
    console.warn('⚠️  Warning: ANTHROPIC_API_KEY does not appear to be in the expected format.');
  }

  console.log('✅ Environment validation passed');
}

// Validate environment on startup
validateEnvironment();

// =============================================================================
// APP INITIALIZATION
// =============================================================================

const app = express();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize RAG service
const ragService = new RAGService();
ragService.loadDefaultDocuments();

// =============================================================================
// RATE LIMITING
// =============================================================================

function createRateLimiter(windowMs, maxRequests) {
  const store = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
      if (now - data.windowStart > windowMs) {
        store.delete(key);
      }
    }
  }, 60000);

  return function rateLimiter(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let clientData = store.get(clientIP);

    if (!clientData || now - clientData.windowStart > windowMs) {
      clientData = { windowStart: now, requestCount: 1 };
      store.set(clientIP, clientData);
    } else {
      clientData.requestCount++;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientData.requestCount));
    res.setHeader('X-RateLimit-Reset', Math.ceil((clientData.windowStart + windowMs) / 1000));

    if (clientData.requestCount > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please wait before making more requests.',
        retryAfter: Math.ceil((clientData.windowStart + windowMs - now) / 1000)
      });
    }

    next();
  };
}

const chatRateLimiter = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);
// Keyed per-IP, but an entire wedding venue's wifi typically NATs all guests behind
// one public IP — these limits are sized for many guests sharing a single IP, not a lone client.
const photoUploadRateLimiter = createRateLimiter(10 * 60 * 1000, 100); // 100 uploads / 10 min / IP
const photoListRateLimiter = createRateLimiter(60 * 1000, 300); // 300 requests / min / IP
const adminRateLimiter = createRateLimiter(60 * 1000, 30); // 30 requests / min / IP
const videoUploadRateLimiter = createRateLimiter(10 * 60 * 1000, 50); // 50 uploads / 10 min / IP — shared venue wifi NATs many guests behind one IP
const videoListRateLimiter = createRateLimiter(60 * 1000, 300); // 300 requests / min / IP

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Limit length (prevent extremely long messages)
  const MAX_MESSAGE_LENGTH = 2000;
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
  }

  return sanitized;
}

// Photo EXIF metadata sent by the client is whitelisted and re-validated
// here rather than trusted as-is — GPS fields are deliberately excluded.
const ALLOWED_PHOTO_METADATA_FIELDS = [
  'Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime',
  'ISO', 'Flash', 'DateTimeOriginal', 'Orientation', 'ExifImageWidth', 'ExifImageHeight', 'Software',
];
const MAX_METADATA_FIELD_LENGTH = 200;

function sanitizePhotoMetadata(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const sanitized = {};
  for (const field of ALLOWED_PHOTO_METADATA_FIELDS) {
    const value = parsed[field];
    if (value === undefined || value === null) continue;
    if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[field] = value;
    } else if (typeof value === 'string' && value.length > 0 && value.length <= MAX_METADATA_FIELD_LENGTH) {
      sanitized[field] = value;
    }
  }
  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function validateChatInput(req, res, next) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (typeof message !== 'string') {
    return res.status(400).json({ error: 'Message must be a string' });
  }

  // Sanitize the message
  req.body.message = sanitizeInput(message);

  if (!req.body.message) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  next();
}

// =============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// =============================================================================

async function withRetry(fn, maxRetries = MAX_RETRIES, initialDelay = INITIAL_RETRY_DELAY_MS) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// =============================================================================
// TIMEOUT WRAPPER
// =============================================================================

function withTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.) in development
    if (!origin && NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limit body size

// Trust proxy for accurate IP addresses (for rate limiting)
app.set('trust proxy', 1);

// =============================================================================
// ROUTES
// =============================================================================

// Health check (no rate limiting)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    documentsLoaded: ragService.getDocumentCount(),
    environment: NODE_ENV
  });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// 'photo' is the watermarked, publicly-displayed version; 'original' is the
// same photo without the watermark, stored privately alongside it.
const photoUploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'original', maxCount: 1 },
]);

app.post('/api/photos/upload', photoUploadRateLimiter, (req, res, next) => {
  photoUploadFields(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'That photo is too large (max 15MB). Please try a smaller one.' });
      }
      console.error('Upload parsing error:', err.message);
      return res.status(400).json({ error: 'Upload failed. Please try again.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const guestName = sanitizeInput(req.body.guestName || '').slice(0, 60);
    if (!guestName) {
      return res.status(400).json({ error: 'Please enter your name.' });
    }
    const photoFile = req.files?.photo?.[0];
    const originalFile = req.files?.original?.[0];
    if (!photoFile) {
      return res.status(400).json({ error: 'No photo was uploaded.' });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(photoFile.mimetype)) {
      return res.status(400).json({ error: 'Only image files are allowed.' });
    }

    const blob = await uploadPhoto(photoFile.buffer, guestName, photoFile.mimetype);

    if (originalFile && ALLOWED_IMAGE_TYPES.includes(originalFile.mimetype)) {
      try {
        await uploadOriginalPhoto(blob.pathname, originalFile.buffer, originalFile.mimetype);
      } catch (error) {
        // Non-fatal — the watermarked photo itself uploaded fine; the
        // unwatermarked original just won't be available for this one.
        console.error('Original photo upload error:', error.message);
      }
    }

    const metadata = req.body.metadata ? sanitizePhotoMetadata(req.body.metadata) : null;
    if (metadata) {
      try {
        await uploadPhotoMetadata(blob.pathname, metadata);
      } catch (error) {
        // Non-fatal — the photo itself uploaded fine; it just won't have metadata available.
        console.error('Photo metadata upload error:', error.message);
      }
    }

    // Admin-only — never exposed via the public metadata endpoint. Helps
    // identify who's actually behind a joke guest name.
    try {
      await uploadPhotoAdminMetadata(blob.pathname, {
        ip: req.ip,
        userAgent: req.get('user-agent') || null,
      });
    } catch (error) {
      console.error('Photo admin metadata upload error:', error.message);
    }

    res.json({ success: true, url: blob.url });
  } catch (error) {
    console.error('Photo upload error:', error.message);
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB
});

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'];

app.post('/api/videos/upload', videoUploadRateLimiter, (req, res, next) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'That video is too large (max 250MB). Please try a shorter clip.' });
      }
      console.error('Video upload parsing error:', err.message);
      return res.status(400).json({ error: 'Upload failed. Please try again.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const guestName = sanitizeInput(req.body.guestName || '').slice(0, 60);
    if (!guestName) {
      return res.status(400).json({ error: 'Please enter your name.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No video was uploaded.' });
    }
    if (!ALLOWED_VIDEO_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only video files are allowed.' });
    }

    const blob = await uploadVideo(req.file.buffer, guestName, req.file.mimetype);
    res.json({ success: true, url: blob.url });
  } catch (error) {
    console.error('Video upload error:', error.message);
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
});

app.get('/api/videos', videoListRateLimiter, async (req, res) => {
  try {
    const videos = await listVideos();
    res.json({ videos });
  } catch (error) {
    console.error('List videos error:', error.message);
    res.status(500).json({ error: 'Unable to load videos right now.' });
  }
});

app.get('/api/photos', photoListRateLimiter, async (req, res) => {
  try {
    const photos = await listPhotos();
    res.json({ photos });
  } catch (error) {
    console.error('List photos error:', error.message);
    res.status(500).json({ error: 'Unable to load photos right now.' });
  }
});

app.get('/api/photos/metadata', photoListRateLimiter, async (req, res) => {
  try {
    const pathname = req.query.id;
    if (!pathname || typeof pathname !== 'string' || !pathname.startsWith('guest-photos/')) {
      return res.status(400).json({ error: 'Invalid photo id.' });
    }
    const metadata = await getPhotoMetadata(pathname);
    if (!metadata) {
      return res.status(404).json({ error: 'No metadata available for this photo.' });
    }
    res.json({ metadata });
  } catch (error) {
    console.error('Get photo metadata error:', error.message);
    res.status(500).json({ error: 'Unable to load photo metadata right now.' });
  }
});

function requireAdmin(req, res, next) {
  const providedPassword = req.get('x-admin-password');
  if (!providedPassword || providedPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }
  next();
}

app.get('/api/admin/photos', adminRateLimiter, requireAdmin, async (req, res) => {
  try {
    const photos = await listPhotos();
    res.json({ photos });
  } catch (error) {
    console.error('Admin list photos error:', error.message);
    res.status(500).json({ error: 'Unable to load photos right now.' });
  }
});

app.delete('/api/admin/photos', adminRateLimiter, requireAdmin, async (req, res) => {
  try {
    const pathname = req.query.id;
    if (!pathname || typeof pathname !== 'string' || !pathname.startsWith('guest-photos/')) {
      return res.status(400).json({ error: 'Invalid photo id.' });
    }
    await deletePhoto(pathname);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error.message);
    res.status(500).json({ error: 'Unable to delete photo.' });
  }
});

// Admin-only — includes uploader IP/user-agent alongside the same EXIF
// fields the public endpoint returns. Never exposed to guests.
app.get('/api/admin/photos/metadata', adminRateLimiter, requireAdmin, async (req, res) => {
  try {
    const pathname = req.query.id;
    if (!pathname || typeof pathname !== 'string' || !pathname.startsWith('guest-photos/')) {
      return res.status(400).json({ error: 'Invalid photo id.' });
    }
    const [exif, admin] = await Promise.all([
      getPhotoMetadata(pathname),
      getPhotoAdminMetadata(pathname),
    ]);
    if (!exif && !admin) {
      return res.status(404).json({ error: 'No metadata available for this photo.' });
    }
    res.json({ metadata: { exif, admin } });
  } catch (error) {
    console.error('Get admin photo metadata error:', error.message);
    res.status(500).json({ error: 'Unable to load photo metadata right now.' });
  }
});

// Admin-only — streams back the unwatermarked original for a photo, if one
// was captured (photos uploaded before this feature won't have one).
app.get('/api/admin/photos/original', adminRateLimiter, requireAdmin, async (req, res) => {
  try {
    const pathname = req.query.id;
    if (!pathname || typeof pathname !== 'string' || !pathname.startsWith('guest-photos/')) {
      return res.status(400).json({ error: 'Invalid photo id.' });
    }
    const original = await getOriginalPhoto(pathname);
    if (!original) {
      return res.status(404).json({ error: 'No original available for this photo.' });
    }
    res.set('Content-Type', original.contentType || 'image/jpeg');
    res.send(original.buffer);
  } catch (error) {
    console.error('Get original photo error:', error.message);
    res.status(500).json({ error: 'Unable to load the original photo right now.' });
  }
});

app.get('/api/admin/videos', adminRateLimiter, requireAdmin, async (req, res) => {
  try {
    const videos = await listVideos();
    res.json({ videos });
  } catch (error) {
    console.error('Admin list videos error:', error.message);
    res.status(500).json({ error: 'Unable to load videos right now.' });
  }
});

app.delete('/api/admin/videos', adminRateLimiter, requireAdmin, async (req, res) => {
  try {
    const pathname = req.query.id;
    if (!pathname || typeof pathname !== 'string' || !pathname.startsWith('guest-videos/')) {
      return res.status(400).json({ error: 'Invalid video id.' });
    }
    await deleteVideo(pathname);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete video error:', error.message);
    res.status(500).json({ error: 'Unable to delete video.' });
  }
});

// Chat endpoint with rate limiting and input validation
app.post('/api/chat', chatRateLimiter, validateChatInput, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // Retrieve relevant context from RAG
    const relevantContext = ragService.search(message, 3);
    const contextText = relevantContext.length > 0
      ? relevantContext.map(doc => doc.content).join('\n\n')
      : '';

    // Build the system prompt with RAG context
    const systemPrompt = `You are the Camp Javery wedding assistant for Jared and Avery's summer camp themed wedding at Camp Newaygo, Michigan (Labor Day Weekend 2026, September 3-6).

STRICT RULES - YOU MUST FOLLOW THESE:
1. You may ONLY answer questions related to the Camp Javery wedding, including: the venue, schedule, lodging, accommodations, dress code, what to bring, FAQs, the couple (Jared, Avery, Pugsley), and contact information.
2. If someone asks about ANYTHING not related to this wedding (e.g., general knowledge, other topics, coding, math, politics, etc.), you must politely decline and redirect them to ask about the wedding instead.
3. Example response for off-topic questions: "That's a great question — Google has always been an acceptable source of information! I'm only able to help with questions about Jared and Avery's wedding at Camp Javery. Is there anything about the venue, schedule, lodging, or what to bring that I can help you with?"

${contextText ? `Here is the wedding information to reference:\n\n${contextText}\n\n` : ''}

Guidelines:
- Be warm, friendly, and excited about the wedding
- Keep responses concise but helpful
- Use a casual, welcoming tone fitting for a fun summer camp wedding
- If you don't have specific wedding information, suggest they contact the couple at javery.chapmanwine@gmail.com
- Never answer questions unrelated to this wedding`;

    // Build messages array (sanitize conversation history too)
    const messages = [
      ...conversationHistory.slice(-10).map(msg => ({ // Limit history to last 10 messages
        role: msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
        content: sanitizeInput(msg.content || '')
      })).filter(msg => msg.content), // Remove empty messages
      { role: 'user', content: message }
    ];

    // Call Claude API with retry and timeout
    const response = await withRetry(async () => {
      return await withTimeout(
        anthropic.messages.create({
          model: 'claude-haiku-4-5-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages,
        }),
        API_TIMEOUT_MS,
        'Request to Claude API timed out'
      );
    });

    const assistantMessage = response.content[0].text;

    res.json({
      message: assistantMessage,
      sources: relevantContext.map(doc => doc.title)
    });

  } catch (error) {
    // Log the full error server-side
    console.error('Chat error:', error.message);

    // Return generic error message to client
    const statusCode = error.status || 500;
    const isTimeout = error.message?.includes('timed out');

    res.status(statusCode).json({
      error: isTimeout
        ? 'The request took too long. Please try again.'
        : 'Unable to process your message. Please try again later.'
    });
  }
});

// Endpoint to add documents to the knowledge base (protected in production)
app.post('/api/documents', chatRateLimiter, (req, res) => {
  // In production, this should require authentication
  if (NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is disabled in production' });
  }

  try {
    const { title, content, metadata = {} } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    ragService.addDocument({ title, content, metadata });
    res.json({ success: true, message: 'Document added successfully' });

  } catch (error) {
    console.error('Document error:', error.message);
    res.status(500).json({ error: 'Failed to add document' });
  }
});

// Get all documents (protected in production)
app.get('/api/documents', (req, res) => {
  if (NODE_ENV === 'production') {
    return res.status(403).json({ error: 'This endpoint is disabled in production' });
  }

  const documents = ragService.getAllDocuments();
  res.json({ documents });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(PORT, () => {
  console.log(`\n🏕️  Camp Javery Wedding Server`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Documents loaded: ${ragService.getDocumentCount()}`);
  console.log(`   Rate limit: ${RATE_LIMIT_MAX_REQUESTS} requests per minute`);
  console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}\n`);
});
