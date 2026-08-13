import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import './index.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  );
}

export default App;
