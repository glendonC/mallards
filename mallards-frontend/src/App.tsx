import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import LandingPage from './pages/LandingPage';
import DataUpload from './pages/DataUpload';
import DataMapping from './pages/DataMapping';
import DataConfiguration from './pages/DataConfiguration';
import ModelSelection from './pages/ModelSelection';
import "./styles/global.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/upload" element={<DataUpload />} />
            <Route path="/mapping" element={<DataMapping />} />
            <Route path="/configure" element={<DataConfiguration />} />
            <Route path="/models" element={<ModelSelection />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App; 