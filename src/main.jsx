import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/base.css';
import './styles/brand.css';
import './styles/landing.css';
import './styles/auth.css';
import './styles/app.css';
import './styles/admin.css';
import './styles/motion.css';

// Set before the first render so below-the-fold entrances start paused
// (RevealObserver un-pauses each block as it scrolls into view).
if ('IntersectionObserver' in window) document.documentElement.classList.add('reveal-ready');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
