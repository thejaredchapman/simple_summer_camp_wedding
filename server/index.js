import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { RAGService } from './rag.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize RAG service
const ragService = new RAGService();

// Load wedding knowledge base on startup
ragService.loadDefaultDocuments();

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Retrieve relevant context from RAG
    const relevantContext = ragService.search(message, 3);
    const contextText = relevantContext.length > 0
      ? relevantContext.map(doc => doc.content).join('\n\n')
      : '';

    // Build the system prompt with RAG context
    const systemPrompt = `You are a friendly and helpful wedding assistant for a summer camp themed wedding.
You help guests with questions about the wedding venue, schedule, accommodations, dress code, and other details.

${contextText ? `Here is relevant information from the wedding knowledge base:\n\n${contextText}\n\n` : ''}

Guidelines:
- Be warm, friendly, and excited about the wedding
- If you don't have specific information, say so politely and suggest they contact the couple directly
- Keep responses concise but helpful
- Use a casual, welcoming tone fitting for a fun summer camp wedding`;

    // Build messages array
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const assistantMessage = response.content[0].text;

    res.json({
      message: assistantMessage,
      sources: relevantContext.map(doc => doc.title)
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
});

// Endpoint to add documents to the knowledge base
app.post('/api/documents', (req, res) => {
  try {
    const { title, content, metadata = {} } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    ragService.addDocument({ title, content, metadata });
    res.json({ success: true, message: 'Document added successfully' });

  } catch (error) {
    console.error('Document error:', error);
    res.status(500).json({ error: 'Failed to add document' });
  }
});

// Get all documents
app.get('/api/documents', (req, res) => {
  const documents = ragService.getAllDocuments();
  res.json({ documents });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', documentsLoaded: ragService.getDocumentCount() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Loaded ${ragService.getDocumentCount()} documents into knowledge base`);
});
