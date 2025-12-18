import React from 'react';
import ReactDOM from 'react-dom/client';
import { TemplateProvider } from '../context/TemplateContext';
import App from '../components/App';
import '../i18n/config';

import './main.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TemplateProvider>
      <App />
    </TemplateProvider>
  </React.StrictMode>
);

