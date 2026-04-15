import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Este fica, é o do Tailwind!
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
