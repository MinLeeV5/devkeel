import { createRoot } from 'react-dom/client'

import { App } from './App'
import './styles/app.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('React root element #root is missing')
}

createRoot(root).render(<App />)
