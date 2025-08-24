import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  localnet: { url: 'http://127.0.0.1:9000' },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SuiClientProvider networks={networks} defaultNetwork="testnet">
      <WalletProvider>
        <App />
      </WalletProvider>
    </SuiClientProvider>
  </React.StrictMode>,
);
