
import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { BrowserRouter } from 'react-router-dom';
import { ColorUIProvider } from './context/ColorUIProvider';
import { MainRoutes } from './routes/MainRoutes';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { MainTheme } from './Theme/MainTheme';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={esES}>
        <ColorUIProvider>
          <MainTheme>
             
                <MainRoutes />
             
            </MainTheme>
        </ColorUIProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);