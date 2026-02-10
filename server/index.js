import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { RAGService } from './rag.js';

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
  const requiredVars = ['ANTHROPIC_API_KEY'];
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

const rateLimitStore = new Map();

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup old entries every minute
setInterval(cleanupRateLimitStore, 60000);

function rateLimiter(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  let clientData = rateLimitStore.get(clientIP);

  if (!clientData || now - clientData.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    clientData = { windowStart: now, requestCount: 1 };
    rateLimitStore.set(clientIP, clientData);
  } else {
    clientData.requestCount++;
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - clientData.requestCount));
  res.setHeader('X-RateLimit-Reset', Math.ceil((clientData.windowStart + RATE_LIMIT_WINDOW_MS) / 1000));

  if (clientData.requestCount > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please wait before making more requests.',
      retryAfter: Math.ceil((clientData.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000)
    });
  }

  next();
}

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

// Chat endpoint with rate limiting and input validation
app.post('/api/chat', rateLimiter, validateChatInput, async (req, res) => {
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
3. Example response for off-topic questions: "I'm here to help with questions about Jared and Avery's wedding at Camp Javery! Is there anything about the venue, schedule, lodging, or what to bring that I can help you with?"

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
app.post('/api/documents', rateLimiter, (req, res) => {
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
