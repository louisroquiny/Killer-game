import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './defaultMissionsPatch.js'
import './timerInputPatch.js'
import './rulesSpeechPatch.js'
import './defaultTimerPatch.js'
import './timeoutVictoryPatch.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
