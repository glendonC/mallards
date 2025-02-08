import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import "./styles/global.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
    </ThemeProvider>
  );
};

export default App; 