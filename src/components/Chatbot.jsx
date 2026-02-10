import { useState, useRef, useEffect, useCallback } from 'react';
import { API_URL, MAX_MESSAGE_LENGTH } from '../constants';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m the Camp Javery wedding assistant. Ask me anything about the wedding weekend!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key to close chat
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Truncate if too long
    const sanitizedInput = trimmedInput.substring(0, MAX_MESSAGE_LENGTH);

    const userMessage = { role: 'user', content: sanitizedInput };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Get conversation history (exclude the initial greeting)
      const conversationHistory = messages
        .slice(1)
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitizedInput,
          conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        sources: data.sources
      }]);

    } catch (err) {
      const errorMessage = err.message || 'Sorry, I had trouble connecting. Please try again.';
      setError(errorMessage);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="chat-toggle-button"
        style={{
          position: 'fixed',
          bottom: isMobile ? '15px' : '20px',
          right: isMobile ? '15px' : '20px',
          width: isMobile ? '56px' : '70px',
          height: isMobile ? '56px' : '70px',
          borderRadius: '50%',
          backgroundColor: 'white',
          border: '3px solid #4a7c59',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          padding: '8px',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        aria-label={isOpen ? 'Close wedding assistant chat' : 'Open wedding assistant chat'}
        aria-expanded={isOpen}
        aria-controls="chat-window"
      >
        {isOpen ? (
          <span style={{ fontSize: isMobile ? '20px' : '24px', color: '#4a7c59' }} aria-hidden="true">{'\u2715'}</span>
        ) : (
          <img
            src="/camp-sign.png"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          id="chat-window"
          ref={chatWindowRef}
          role="dialog"
          aria-label="Wedding Assistant Chat"
          aria-modal="false"
          style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '100px',
            right: isMobile ? '10px' : '20px',
            left: isMobile ? '10px' : 'auto',
            width: isMobile ? 'auto' : '380px',
            maxWidth: isMobile ? 'none' : 'calc(100vw - 40px)',
            height: isMobile ? 'calc(100vh - 160px)' : '500px',
            maxHeight: isMobile ? 'none' : 'calc(100vh - 120px)',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: '#4a7c59',
              color: 'white',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <img
              src="/camp-sign.png"
              alt=""
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              aria-hidden="true"
            />
            <span id="chat-title">Camp Javery Assistant</span>
          </div>

          {/* Messages */}
          <div
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#fafafa'
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <div
                  style={{
                    backgroundColor: msg.role === 'user' ? '#4a7c59' : 'white',
                    color: msg.role === 'user' ? 'white' : '#333',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#888',
                      marginTop: '4px',
                      paddingLeft: '8px'
                    }}
                  >
                    Sources: {msg.sources.join(', ')}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator with ARIA live region */}
            {isLoading && (
              <div
                role="status"
                aria-label="Assistant is typing"
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'white',
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  display: 'flex',
                  gap: '4px'
                }}
              >
                <span className="typing-dot" style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0s' }} aria-hidden="true">{'\u25CF'}</span>
                <span className="typing-dot" style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} aria-hidden="true">{'\u25CF'}</span>
                <span className="typing-dot" style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} aria-hidden="true">{'\u25CF'}</span>
                <span className="sr-only">Assistant is typing a response</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              style={{
                padding: '8px 16px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                fontSize: '12px',
                textAlign: 'center'
              }}
            >
              {error}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderTop: '1px solid #eee',
              display: 'flex',
              gap: '8px',
              backgroundColor: 'white'
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              Type your message
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isMobile ? "Ask a question..." : "Ask about venue, schedule, dress code..."}
              disabled={isLoading}
              maxLength={MAX_MESSAGE_LENGTH}
              style={{
                flex: 1,
                padding: isMobile ? '10px 14px' : '12px 16px',
                borderRadius: '24px',
                border: '1px solid #ddd',
                fontSize: isMobile ? '16px' : '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                minWidth: 0
              }}
              onFocus={(e) => e.target.style.borderColor = '#4a7c59'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
              aria-describedby={error ? 'chat-error' : undefined}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              style={{
                padding: isMobile ? '10px 16px' : '12px 20px',
                backgroundColor: isLoading || !inputValue.trim() ? '#ccc' : '#4a7c59',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                flexShrink: 0
              }}
              aria-label={isLoading ? 'Sending message...' : 'Send message'}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </>
  );
}

export default Chatbot;
