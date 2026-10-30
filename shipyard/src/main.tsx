import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/inter/index.css';
import '@fontsource-variable/newsreader/index.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/shipyard.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { KbProvider } from './kb/context';
import { router } from './routes';
import { StoreProvider } from './store/context';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

createRoot(root).render(
  <StrictMode>
    <KbProvider>
      <StoreProvider>
        <RouterProvider router={router()} />
      </StoreProvider>
    </KbProvider>
  </StrictMode>,
);
