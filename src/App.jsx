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

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <MeetTheCouple />
        <PhotoGallery />
        <Schedule />
        <Lodging />
        <FAQs />
        <ContactUs />
      </main>
      <Footer />
    </div>
  );
}

export default App;
