import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './styles.css';
import './site/site.css';
import './app/app.css';
import { StoreProvider } from './engine/store';
import Site from './site/Site';
import AppShell from './app/AppShell';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Site />} />
          <Route path="/app/*" element={<AppShell />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  </React.StrictMode>,
);
