import GlobalStyles from '@mui/material/GlobalStyles';
import { StyledEngineProvider } from '@mui/material/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import App from './App.tsx';
import ReportPage from './Report.tsx';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/report/:id" element={<ReportPage />} />
        </Routes>
      </BrowserRouter>
    </StyledEngineProvider>
  </StrictMode>
);
