import { useEffect, useRef, useState } from 'react';
import { sendBoothStrip } from '../lib/photoboothApi';
import './DeliveryScreen.css';

export default function DeliveryScreen({ photoUrl, idleTimeoutMs, onIdle, onDone }) {
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [result, setResult] = useState(null);
  const [retryingChannel, setRetryingChannel] = useState(null); // null | 'email' | 'sms'
  const [errorMessage, setErrorMessage] = useState('');
  const idleTimerRef = useRef(null);

  useEffect(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(onIdle, idleTimeoutMs);
    return () => clearTimeout(idleTimerRef.current);
  }, [idleTimeoutMs, onIdle, status]);

  async function handleSend(e) {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setErrorMessage('Enter an email or phone number.');
      return;
    }
    setStatus('sending');
    setErrorMessage('');
    try {
      const sendResult = await sendBoothStrip({
        photoUrl,
        guestName: guestName.trim() || 'Photo Booth Guest',
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setResult(sendResult);
      setStatus('sent');
    } catch (error) {
      setStatus('idle');
      setErrorMessage(error.message || 'Send failed. Please try again.');
    }
  }

  // Retries only the one failed channel — a channel that already succeeded
  // is never re-sent.
  async function handleRetryChannel(channel) {
    setRetryingChannel(channel);
    try {
      const retryResult = await sendBoothStrip({
        photoUrl,
        guestName: guestName.trim() || 'Photo Booth Guest',
        email: channel === 'email' ? email.trim() : undefined,
        phone: channel === 'sms' ? phone.trim() : undefined,
      });
      setResult(prev => ({ ...prev, [channel]: retryResult[channel] }));
    } catch (error) {
      setResult(prev => ({
        ...prev,
        [channel]: { success: false, error: error.message || 'Retry failed.' },
      }));
    } finally {
      setRetryingChannel(null);
    }
  }

  if (status === 'sent') {
    return (
      <div className="screen delivery-screen">
        <img src={photoUrl} alt="Your photo strip" className="delivery-strip-preview" />
        {result?.email && (
          <p className={result.email.success ? 'delivery-success' : 'delivery-error'}>
            {result.email.success ? 'Emailed! ✓' : `Email failed: ${result.email.error}`}
          </p>
        )}
        {result?.email && !result.email.success && (
          <button
            type="button"
            className="delivery-retry-button"
            onClick={() => handleRetryChannel('email')}
            disabled={retryingChannel === 'email'}
          >
            {retryingChannel === 'email' ? 'Retrying…' : 'Retry Email'}
          </button>
        )}
        {result?.sms && (
          <p className={result.sms.success ? 'delivery-success' : 'delivery-error'}>
            {result.sms.success ? 'Texted! ✓' : `Text failed: ${result.sms.error}`}
          </p>
        )}
        {result?.sms && !result.sms.success && (
          <button
            type="button"
            className="delivery-retry-button"
            onClick={() => handleRetryChannel('sms')}
            disabled={retryingChannel === 'sms'}
          >
            {retryingChannel === 'sms' ? 'Retrying…' : 'Retry Text'}
          </button>
        )}
        <button type="button" className="delivery-done-button" onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="screen delivery-screen">
      <img src={photoUrl} alt="Your photo strip" className="delivery-strip-preview" />
      <form onSubmit={handleSend} className="delivery-form">
        <label htmlFor="booth-name">Your name (optional)</label>
        <input id="booth-name" type="text" value={guestName} onChange={e => setGuestName(e.target.value)} maxLength={60} />

        <label htmlFor="booth-email">Email</label>
        <input id="booth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />

        <label htmlFor="booth-phone">Phone number</label>
        <input id="booth-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />

        {errorMessage && <p className="delivery-error" role="alert">{errorMessage}</p>}

        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send My Photos'}
        </button>
        <button type="button" className="delivery-skip-button" onClick={onDone}>
          Skip, just save to gallery
        </button>
      </form>
    </div>
  );
}
