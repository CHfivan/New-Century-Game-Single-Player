/**
 * LoadingScreen component
 * Preloads all game images and shows a progress bar.
 * Once all images are loaded, fades out and calls onComplete.
 */

import React, { useEffect, useState, useRef } from 'react'
import { assetUrl } from '../utils/assetUrl'
import './LoadingScreen.css'

/** All unique image paths used by the game */
const IMAGE_PATHS: string[] = [
  // Background
  '/assets/image/bg3.jpeg',
  // UI images
  '/assets/image/gold_coin.png',
  '/assets/image/silver_coin.png',
  '/assets/image/VP_card.png',
  '/assets/image/Merchant_card.png',
  '/assets/image/hand2.jpg',
  '/assets/image/players.png',
  '/assets/image/played_cards.png',
  // Merchant card images (unique files)
  '/assets/cards/merchant/merchant_1.PNG',
  '/assets/cards/merchant/merchant_2.PNG',
  '/assets/cards/merchant/merchant_4.PNG',
  '/assets/cards/merchant/Merchant5.png',
  '/assets/cards/merchant/Merchant6.png',
  '/assets/cards/merchant/Merchant7.PNG',
  '/assets/cards/merchant/Merchant8.PNG',
  // Point card images (unique files)
  '/assets/cards/point/VP_1.PNG',
  '/assets/cards/point/VP_2.png',
  '/assets/cards/point/VP_3.png',
  '/assets/cards/point/VP_4.png',
  '/assets/cards/point/VP_5.jpg',
]

interface LoadingScreenProps {
  onComplete: () => void
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [fadingOut, setFadingOut] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    const total = IMAGE_PATHS.length
    let loaded = 0

    const onImageDone = () => {
      loaded++
      setProgress(Math.round((loaded / total) * 100))

      if (loaded >= total && !completedRef.current) {
        completedRef.current = true
        // Small delay so user sees 100%, then fade out
        setTimeout(() => {
          setFadingOut(true)
          setTimeout(onComplete, 500) // match CSS fade duration
        }, 300)
      }
    }

    IMAGE_PATHS.forEach((path) => {
      const img = new Image()
      img.onload = onImageDone
      img.onerror = onImageDone // count errors as loaded to avoid getting stuck
      img.src = assetUrl(path)
    })
  }, [onComplete])

  return (
    <div
      className={`loading-screen ${fadingOut ? 'fade-out' : ''}`}
      style={{ backgroundImage: `url('${assetUrl('/assets/image/bg3.jpeg')}')` }}
    >
      <div className="loading-screen-content">
        <h1 className="loading-title">Century: Spice Road</h1>
        <p className="loading-subtitle">Loading game assets...</p>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="loading-percent">{progress}%</p>
      </div>
    </div>
  )
}
