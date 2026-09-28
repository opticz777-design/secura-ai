import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

// Global fetch override to ensure HttpOnly cookies are sent with all API requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [resource, config] = args;
  
  // Only append credentials for our API endpoints, not external ones if they exist
  if (typeof resource === 'string' && (resource.includes('localhost:5000') || resource.includes('/api'))) {
    const newConfig = config || {};
    newConfig.credentials = 'include';
    
    // Also remove the old x-user- headers since backend uses JWT
    if (newConfig.headers) {
      if (newConfig.headers instanceof Headers) {
        const keys = Array.from((newConfig.headers as any).keys());
        keys.forEach(k => {
          if ((k as string).toLowerCase().startsWith('x-user-')) {
            (newConfig.headers as Headers).delete(k as string);
          }
        });
      } else if (Array.isArray(newConfig.headers)) {
        newConfig.headers = newConfig.headers.filter(h => !h[0].toLowerCase().startsWith('x-user-'));
      } else {
        const newHeaders: any = { ...newConfig.headers };
        Object.keys(newHeaders).forEach(k => {
          if (k.toLowerCase().startsWith('x-user-')) delete newHeaders[k];
        });
        newConfig.headers = newHeaders;
      }
    }
    
    return originalFetch(resource, newConfig);
  }
  
  return originalFetch(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);

