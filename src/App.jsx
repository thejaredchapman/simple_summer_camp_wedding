import { lazy, Suspense } from 'react';
import {
  Navbar,
  Hero,
  MeetTheCouple,
  PhotoGallery,
  Schedule,
  Lodging,
  FAQs,
  ContactUs,
  Footer
} from './components';
import './index.css';

// Lazy load the Chatbot component for better initial page load
const Chatbot = lazy(() => import('./components/Chatbot'));

function App() {
  return (
    <div className="app">
      <Navbar />
      <main id="main-content">
        <Hero />
        <MeetTheCouple />
        <PhotoGallery />
        <Schedule />
        <Lodging />
        <FAQs />
        <ContactUs />
      </main>
      <Footer />

      {/* Chatbot loads asynchronously after main content */}
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
    </div>
  );
}

export default App;
