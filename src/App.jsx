import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import GalleryPage from './pages/GalleryPage';
import SlideshowPage from './pages/SlideshowPage';
import AdminPage from './pages/AdminPage';
import './index.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/slideshow" element={<SlideshowPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;
