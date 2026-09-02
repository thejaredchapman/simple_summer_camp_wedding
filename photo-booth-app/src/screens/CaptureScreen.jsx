import { useEffect, useRef, useState } from 'react';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { compositeStrip } from '../lib/compositeStrip';
import './CaptureScreen.css';

const COUNTDOWN_SECONDS = 3;
const FREEZE_FRAME_MS = 1200;
const IDLE_WATCHDOG_MS = 60000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function CaptureScreen({ mode, onStripReady, onCancel }) {
  const [countdown, setCountdown] = useState(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [freezeFrameUrl, setFreezeFrameUrl] = useState(null);
  const [status, setStatus] = useState('starting'); // starting | countdown | frozen | compositing | error
  const [errorMessage, setErrorMessage] = useState('');
  const capturedShotsRef = useRef([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    capturedShotsRef.current = [];
    document.body.classList.add('camera-preview-active');

    async function runCountdown() {
      setStatus('countdown');
      for (let n = COUNTDOWN_SECONDS; n > 0; n--) {
        if (cancelledRef.current) return;
        setCountdown(n);
        await sleep(1000);
      }
      setCountdown(null);
    }

    async function captureShot() {
      const result = await CameraPreview.capture({ quality: 90 });
      return `data:image/jpeg;base64,${result.value}`;
    }

    async function runShotSequence() {
      for (let i = 0; i < mode; i++) {
        if (cancelledRef.current) return;
        setShotIndex(i);
        await runCountdown();
        if (cancelledRef.current) return;
        const dataUrl = await captureShot();
        if (cancelledRef.current) return;
        capturedShotsRef.current.push(dataUrl);
        setFreezeFrameUrl(dataUrl);
        setStatus('frozen');
        await sleep(FREEZE_FRAME_MS);
        if (cancelledRef.current) return;
        setFreezeFrameUrl(null);
      }
      if (cancelledRef.current) return;
      setStatus('compositing');
      const strip = await compositeStrip(capturedShotsRef.current);
      await CameraPreview.stop();
      if (!cancelledRef.current) onStripReady(strip);
    }

    async function startAndRun() {
      try {
        await CameraPreview.start({
          position: 'rear',
          toBack: true,
          disableAudio: true,
          enableZoom: false,
        });
      } catch {
        if (!cancelledRef.current) {
          setStatus('error');
          setErrorMessage('Could not access the camera. Check camera permission in Android settings.');
        }
        return;
      }
      await runShotSequence();
    }

    startAndRun();

    return () => {
      cancelledRef.current = true;
      document.body.classList.remove('camera-preview-active');
      CameraPreview.stop().catch(() => {});
    };
  }, [mode, onStripReady]);

  // Safety-net idle timeout: the sequence above is autonomous (countdown +
  // capture drive themselves), so this only fires if something gets stuck
  // (e.g. the camera hangs) — it resets on every state change the sequence
  // makes, and only returns Home if NOTHING has progressed for 60s.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!cancelledRef.current) {
        cancelledRef.current = true;
        CameraPreview.stop().catch(() => {});
        onCancel();
      }
    }, IDLE_WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, [status, countdown, shotIndex, freezeFrameUrl, onCancel]);

  function handleCancel() {
    cancelledRef.current = true;
    CameraPreview.stop().catch(() => {});
    onCancel();
  }

  return (
    <div className="screen capture-screen">
      <button type="button" className="capture-cancel-button" onClick={handleCancel}>
        Cancel
      </button>
      <div className="capture-shot-counter">
        Shot {shotIndex + 1} of {mode}
      </div>
      {status === 'countdown' && countdown && (
        <div className="capture-countdown">{countdown}</div>
      )}
      {status === 'frozen' && freezeFrameUrl && (
        <img src={freezeFrameUrl} alt="Just captured" className="capture-freeze-frame" />
      )}
      {status === 'compositing' && <div className="capture-status">Putting your strip together…</div>}
      {status === 'error' && <div className="capture-error">{errorMessage}</div>}
    </div>
  );
}
