/**
 * LoadingScreen component
 * Preloads all game images using fetch() with byte-level progress tracking.
 * Shows a smooth progress bar that increments every 1%.
 * Once all images are loaded, fades out and calls onComplete.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { assetUrl } from '../utils/assetUrl'
import './LoadingScreen.css'

/** All unique image paths used by the game (must match actual filenames exactly) */
const IMAGE_PATHS: string[] = [
  // Background
  '/assets/image/bg3.jpeg',
  // UI images
  '/assets/image/gold_coin.png',
  '/assets/image/silver_coin.png',
  '/assets/image/VP_card.webp',
  '/assets/image/Merchant_card.webp',
  '/assets/image/hand2.jpg',
  '/assets/image/players.png',
  '/assets/image/played_cards.png',
  // Merchant card images (unique files)
  '/assets/cards/merchant/merchant_1.webp',
  '/assets/cards/merchant/merchant_2.webp',
  '/assets/cards/merchant/merchant_4.webp',
  '/assets/cards/merchant/Merchant5.webp',
  '/assets/cards/merchant/Merchant6.webp',
  '/assets/cards/merchant/Merchant7.webp',
  '/assets/cards/merchant/Merchant8.webp',
  // Point card images (unique files)
  '/assets/cards/point/VP_1.webp',
  '/assets/cards/point/VP_2.webp',
  '/assets/cards/point/VP_3.webp',
  '/assets/cards/point/VP_4.webp',
  '/assets/cards/point/VP_5.webp',
]

/**
 * Fetch a single image with byte-level progress reporting.
 * Falls back to a simple Image() load if streaming isn't supported.
 */
async function fetchImageWithProgress(
  url: string,
  onBytes: (bytes: number) => void,
): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) { onBytes(0); return }

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    if (!response.body || total === 0) {
      // No streaming or unknown size — wait for full download, report at end
      const blob = await response.blob()
      // Create object URL and load into Image to warm the browser cache
      const objectUrl = URL.createObjectURL(blob)
      const img = new Image()
      img.src = objectUrl
      await img.decode().catch(() => {})
      URL.revokeObjectURL(objectUrl)
      onBytes(blob.size)
      return
    }

    // Stream the response and report progress as bytes arrive
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        received += value.length
        onBytes(value.length)
      }
    }

    // Reconstruct blob and load into Image to warm browser cache
    const blob = new Blob(chunks)
    const objectUrl = URL.createObjectURL(blob)
    const img = new Image()
    img.src = objectUrl
    await img.decode().catch(() => {})
    URL.revokeObjectURL(objectUrl)
  } catch {
    // On any error, just report 0 and move on
    onBytes(0)
  }
}

interface LoadingScreenProps {
  onComplete: () => void
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [fadingOut, setFadingOut] = useState(false)
  const completedRef = useRef(false)
  const bytesLoadedRef = useRef(0)
  const totalBytesRef = useRef(0)

  const finishLoading = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setProgress(100)
    setTimeout(() => {
      setFadingOut(true)
      setTimeout(onComplete, 500)
    }, 300)
  }, [onComplete])

  useEffect(() => {
    let cancelled = false

    const loadAll = async () => {
      // First, do a HEAD request for each image to get total size
      const sizes = await Promise.all(
        IMAGE_PATHS.map(async (path) => {
          try {
            const resp = await fetch(assetUrl(path), { method: 'HEAD' })
            const cl = resp.headers.get('content-length')
            return cl ? parseInt(cl, 10) : 50_000 // estimate 50KB if unknown
          } catch {
            return 50_000
          }
        })
      )

      const totalBytes = sizes.reduce((a, b) => a + b, 0)
      totalBytesRef.current = totalBytes

      if (cancelled) return

      // Now fetch all images in parallel with progress
      const onBytes = (bytes: number) => {
        if (cancelled) return
        bytesLoadedRef.current += bytes
        const pct = Math.min(
          Math.round((bytesLoadedRef.current / totalBytesRef.current) * 100),
          100
        )
        setProgress(pct)
      }

      await Promise.all(
        IMAGE_PATHS.map((path) => fetchImageWithProgress(assetUrl(path), onBytes))
      )

      if (!cancelled) finishLoading()
    }

    loadAll()

    return () => { cancelled = true }
  }, [finishLoading])

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
