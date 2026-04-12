import {
  Navbar,
  Hero,
  MeetTheCouple,
  TheirStory,
  PhotoGallery,
  Schedule,
  RSVP,
  Lodging,
  GettingThere,
  FAQs,
  ContactUs,
  Footer,
  Chatbot
} from './components';
import './index.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main id="main-content">
        <Hero />
        <TheirStory />
        <MeetTheCouple />
        <PhotoGallery />
        <Schedule />
        <RSVP />
        <Lodging />
        <GettingThere />
        <FAQs />
        <ContactUs />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

export default App;
