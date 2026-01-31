import {
  Navbar,
  Hero,
  MeetTheCouple,
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
        <ContactUs />
      </main>
      <Footer />
    </div>
  );
}

export default App;
