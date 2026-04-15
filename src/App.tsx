import { Demo } from './Demo'
import { MobileOrientationHandler } from './components/MobileOrientationHandler'
import './App.css'

function App() {
  return (
    <MobileOrientationHandler>
      <Demo />
    </MobileOrientationHandler>
  )
}

export default App
