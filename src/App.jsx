import {
  Navbar,
  Hero,
  MeetTheCouple,
  RSVP,
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
        <RSVP />
        <ContactUs />
      </main>
      <Footer />
    </div>
  );
}

export default App;
