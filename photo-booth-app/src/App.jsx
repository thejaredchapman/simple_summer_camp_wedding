import { useState, useCallback } from 'react';
import HomeScreen from './screens/HomeScreen';
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
      {screen === 'capture' && <div className="screen">Capture screen placeholder — Task 9</div>}
      {screen === 'review' && <div className="screen">Review screen placeholder — Task 10</div>}
      {screen === 'delivery' && <div className="screen">Delivery screen placeholder — Task 11</div>}
    </div>
  );
}
