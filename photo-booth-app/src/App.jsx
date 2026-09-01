import { useState, useCallback } from 'react';
import HomeScreen from './screens/HomeScreen';
import CaptureScreen from './screens/CaptureScreen';
import ReviewScreen from './screens/ReviewScreen';
import DeliveryScreen from './screens/DeliveryScreen';
import './App.css';

const IDLE_TIMEOUT_MS = 60000;

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'capture' | 'review' | 'delivery'
  const [mode, setMode] = useState(1); // 1 | 2 | 3 | 4
  const [stripDataUrl, setStripDataUrl] = useState(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);

  const resetToHome = useCallback(() => {
    setScreen('home');
    setStripDataUrl(null);
    setUploadedPhotoUrl(null);
  }, []);

  function handleModeSelected(selectedMode) {
    setMode(selectedMode);
    setScreen('capture');
  }

  function handleStripReady(dataUrl) {
    setStripDataUrl(dataUrl);
    setScreen('review');
  }

  function handleRetake() {
    setStripDataUrl(null);
    setScreen('capture');
  }

  function handleStripUploaded(url) {
    setUploadedPhotoUrl(url);
    setScreen('delivery');
  }

  return (
    <div className="app">
      {screen === 'home' && <HomeScreen onSelectMode={handleModeSelected} />}
      {screen === 'capture' && (
        <CaptureScreen mode={mode} onStripReady={handleStripReady} onCancel={resetToHome} />
      )}
      {screen === 'review' && (
        <ReviewScreen
          stripDataUrl={stripDataUrl}
          onRetake={handleRetake}
          onUploaded={handleStripUploaded}
          idleTimeoutMs={IDLE_TIMEOUT_MS}
          onIdle={resetToHome}
        />
      )}
      {screen === 'delivery' && (
        <DeliveryScreen
          photoUrl={uploadedPhotoUrl}
          stripDataUrl={stripDataUrl}
          idleTimeoutMs={IDLE_TIMEOUT_MS}
          onIdle={resetToHome}
          onDone={resetToHome}
        />
      )}
    </div>
  );
}
