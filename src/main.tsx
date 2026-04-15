import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { assetUrl } from './utils/assetUrl'
import './index.css'

// Set background image dynamically to support Vite base URL on GitHub Pages
document.body.style.backgroundImage = `url('${assetUrl('/assets/image/bg3.jpeg')}')`

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
