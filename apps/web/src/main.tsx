import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Self-hosted fonts (hermetic: no Google Fonts CDN at runtime). Same families
// and weights previously loaded from fonts.googleapis.com.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/ibm-plex-mono/500.css';
import './ui/theme.css';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
