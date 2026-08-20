import { useEffect, useState } from 'react';
import './HowItWorksModal.css';

const STEPS = [
  { emoji: '📸', text: 'Tap "Choose Files" and pick your favorite photos!' },
  { emoji: '✍️', text: "Type your name so everyone knows who shared them!" },
  { emoji: '🚀', text: 'Tap the green button to send your photos!' },
  { emoji: '🎉', text: 'Yay! Your photos show up for everyone to see!' },
];

// A tap-to-open "little screen" rather than hover — hover has no equivalent
// on a touch screen, and most guests will be on their phones.
export default function HowItWorksModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" className="how-it-works-trigger" onClick={() => setOpen(true)}>
        ❓ How do I share photos?
      </button>

      {open && (
        <div className="how-it-works-overlay" onClick={() => setOpen(false)}>
          <div className="how-it-works-modal" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="how-it-works-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2>How to Share Your Photos!</h2>
            <ol className="how-it-works-steps">
              {STEPS.map(step => (
                <li key={step.text}>
                  <span className="how-it-works-emoji" aria-hidden="true">{step.emoji}</span>
                  {step.text}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
