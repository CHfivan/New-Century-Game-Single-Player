import { useState, useCallback } from 'react'
import { Demo } from './Demo'
import { MobileOrientationHandler } from './components/MobileOrientationHandler'
import { LoadingScreen } from './components/LoadingScreen'
import './App.css'

function App() {
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  const handleLoadingComplete = useCallback(() => {
    setAssetsLoaded(true)
  }, [])

  return (
    <MobileOrientationHandler>
      {!assetsLoaded && <LoadingScreen onComplete={handleLoadingComplete} />}
      {assetsLoaded && <Demo />}
    </MobileOrientationHandler>
  )
}

export default App
