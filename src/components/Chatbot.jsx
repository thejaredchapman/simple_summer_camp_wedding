import { useState, useRef, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey there, camper! I'm your Camp Javery wedding guide. Ask me anything about Jared & Avery's big day!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const history = messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) !== 0);

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: history
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Oops, the campfire signal got crossed! Please try again in a moment." }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="chatbot-wrapper">
      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-label="Camp Javery wedding assistant">
          <div className="chatbot-header">
            <span className="chatbot-header-icon">🏕️</span>
            <div>
              <p className="chatbot-header-title">Camp Javery Guide</p>
              <p className="chatbot-header-sub">Ask me about the wedding!</p>
            </div>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages" aria-live="polite">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chatbot-message chatbot-message--${msg.role}`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message chatbot-message--assistant chatbot-message--loading">
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-form" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              className="chatbot-input"
              type="text"
              placeholder="Ask about the wedding..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              maxLength={500}
              aria-label="Your message"
            />
            <button
              className="chatbot-send"
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        className="chatbot-bubble"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'Close camp guide' : 'Open camp guide'}
      >
        🏕️
      </button>
    </div>
  );
}
