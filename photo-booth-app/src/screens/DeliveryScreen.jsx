import { useEffect, useRef, useState } from 'react';
import { sendBoothEmail, shareBoothStripBySms } from '../lib/photoboothApi';
import './DeliveryScreen.css';

export default function DeliveryScreen({ photoUrl, stripDataUrl, idleTimeoutMs, onIdle, onDone }) {
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [emailResult, setEmailResult] = useState(null); // { success, error? } | null
  const [smsOpened, setSmsOpened] = useState(false);
  const [smsError, setSmsError] = useState('');
  const [retryingEmail, setRetryingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const idleTimerRef = useRef(null);

  useEffect(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(onIdle, idleTimeoutMs);
    return () => clearTimeout(idleTimerRef.current);
  }, [idleTimeoutMs, onIdle, status]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedEmail && !trimmedPhone) {
      setErrorMessage('Enter an email or phone number.');
      return;
    }
    setStatus('sending');
    setErrorMessage('');

    // Email first — it's a real network call. Opening Messages backgrounds
    // this app immediately, so anything still in flight afterward risks
    // being suspended.
    if (trimmedEmail) {
      try {
        const result = await sendBoothEmail({
          photoUrl,
          guestName: guestName.trim() || 'Photo Booth Guest',
          email: trimmedEmail,
        });
        setEmailResult(result.email);
      } catch (error) {
        setEmailResult({ success: false, error: error.message || 'Send failed.' });
      }
    }

    if (trimmedPhone) {
      try {
        await shareBoothStripBySms(trimmedPhone, stripDataUrl);
        setSmsOpened(true);
      } catch (error) {
        setSmsError(error.message || 'Could not open Messages.');
      }
    }

    setStatus('sent');
  }

  async function handleRetryEmail() {
    setRetryingEmail(true);
    try {
      const result = await sendBoothEmail({
        photoUrl,
        guestName: guestName.trim() || 'Photo Booth Guest',
        email: email.trim(),
      });
      setEmailResult(result.email);
    } catch (error) {
      setEmailResult({ success: false, error: error.message || 'Retry failed.' });
    } finally {
      setRetryingEmail(false);
    }
  }

  async function handleRetrySms() {
    setSmsError('');
    try {
      await shareBoothStripBySms(phone.trim(), stripDataUrl);
      setSmsOpened(true);
    } catch (error) {
      setSmsError(error.message || 'Could not open Messages.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="screen delivery-screen">
        <img src={photoUrl} alt="Your photo strip" className="delivery-strip-preview" />
        {emailResult && (
          <p className={emailResult.success ? 'delivery-success' : 'delivery-error'}>
            {emailResult.success ? 'Emailed! ✓' : `Email failed: ${emailResult.error}`}
          </p>
        )}
        {emailResult && !emailResult.success && (
          <button
            type="button"
            className="delivery-retry-button"
            onClick={handleRetryEmail}
            disabled={retryingEmail}
          >
            {retryingEmail ? 'Retrying…' : 'Retry Email'}
          </button>
        )}
        {smsOpened && (
          <p className="delivery-success">Opened Messages — tap Send there to finish texting it!</p>
        )}
        {smsError && <p className="delivery-error">{smsError}</p>}
        {smsError && (
          <button type="button" className="delivery-retry-button" onClick={handleRetrySms}>
            Retry Text
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
        <p className="delivery-phone-hint">Opens Messages with your photo attached — you'll tap Send there.</p>

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
