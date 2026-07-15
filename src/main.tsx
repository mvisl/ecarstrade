import React from 'react';
import { createRoot } from 'react-dom/client';
import V3 from './V3';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <V3 />
  </React.StrictMode>,
);
