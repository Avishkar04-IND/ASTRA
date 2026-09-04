import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Overview } from './pages/Overview';
import { Applications } from './pages/Applications';
import { Grievances } from './pages/Grievances';
import './index.css';

function App() {
  return (
    <Router>
      <div className="layout-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/grievances" element={<Grievances />} />
            <Route path="*" element={<div className="text-xl">Coming soon</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
