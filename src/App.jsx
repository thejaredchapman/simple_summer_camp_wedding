import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import UploadVideoPage from './pages/UploadVideoPage';
import GalleryPage from './pages/GalleryPage';
import SlideshowPage from './pages/SlideshowPage';
import VideosPage from './pages/VideosPage';
import AdminPage from './pages/AdminPage';
import './index.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/upload-video" element={<UploadVideoPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/slideshow" element={<SlideshowPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;
