/**
 * AnimationLayer — renders animated clones (cards, cubes) as a fixed overlay.
 * All animations use CSS transform + opacity for GPU compositing / 60 FPS.
 */

import React, { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import './AnimationLayer.css'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnimRect {
  left: number
  top: number
  width: number
  height: number
}

export interface CardFlyAnimation {
  type: 'card-fly'
  imageUrl: string
  from: AnimRect
  to: AnimRect
  duration?: number
}

export interface CubeMoveAnimation {
  type: 'cube-move'
  color: string
  from: AnimRect
  to: AnimRect
  duration?: number
}

export interface ShakeAnimation {
  type: 'shake'
  targetSelector: string
  duration?: number
}

/** Animates cards sliding left to fill a gap, with a new card fading in at the end */
export interface RowSlideAnimation {
  type: 'row-slide'
  /** Rects of ALL cards in the row BEFORE the card was removed */
  cardRects: AnimRect[]
  /** Cloned outerHTML of each card element for pixel-identical rendering */
  cardHtmls: string[]
  /** Index of the card that was removed */
  removedIndex: number
  /** Cloned outerHTML of the new card (or null if deck is empty) */
  newCardHtml: string | null
  /** Rect of the deck */
  deckRect: AnimRect | null
  /** Cloned outerHTML of the deck element */
  deckHtml?: string
  /** Per-card stagger delay in ms */
  staggerDelay?: number
  /** Slide duration per card in ms */
  slideDuration?: number
}

export type GameAnimation = CardFlyAnimation | CubeMoveAnimation | ShakeAnimation | RowSlideAnimation

interface ActiveAnim {
  id: number
  anim: GameAnimation
  phase: 'starting' | 'running' | 'done'
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAnimations() {
  const [active, setActive] = useState<ActiveAnim[]>([])
  const idRef = useRef(0)

  const play = useCallback((anim: GameAnimation): Promise<void> => {
    return new Promise(resolve => {
      const id = ++idRef.current

      if (anim.type === 'shake') {
        const duration = anim.duration ?? 400
        const el = document.querySelector(anim.targetSelector) as HTMLElement | null
        if (el) {
          el.classList.add('anim-shake')
          setTimeout(() => {
            el.classList.remove('anim-shake')
            resolve()
          }, duration)
        } else {
          resolve()
        }
        return
      }

      if (anim.type === 'row-slide') {
        // Row slide is handled entirely by the render component via CSS
        // Total duration = stagger * (count - removedIndex) + slideDuration + fade
        const count = anim.cardRects.length
        const stagger = anim.staggerDelay ?? 150
        const slideDur = anim.slideDuration ?? 500
        const cardsToSlide = count - anim.removedIndex - 1
        const totalDuration = stagger * cardsToSlide + slideDur + 500 // +500 for new card fade

        setActive(prev => [...prev, { id, anim, phase: 'starting' }])

        // Start the animation on next frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setActive(prev => prev.map(a => a.id === id ? { ...a, phase: 'running' } : a))
          })
        })

        setTimeout(() => {
          setActive(prev => prev.filter(a => a.id !== id))
          resolve()
        }, totalDuration + 100)
        return
      }

      const duration = anim.duration ?? 450

      setActive(prev => [...prev, { id, anim, phase: 'starting' }])

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActive(prev => prev.map(a => a.id === id ? { ...a, phase: 'running' } : a))
        })
      })

      setTimeout(() => {
        setActive(prev => prev.filter(a => a.id !== id))
        resolve()
      }, duration + 50)
    })
  }, [])

  const playAll = useCallback((anims: GameAnimation[]): Promise<void> => {
    return Promise.all(anims.map(a => play(a))).then(() => {})
  }, [play])

  const playSequence = useCallback(async (anims: GameAnimation[]): Promise<void> => {
    for (const a of anims) {
      await play(a)
    }
  }, [play])

  return { active, play, playAll, playSequence }
}

// ─── Render Component ───────────────────────────────────────────────────────

interface AnimationLayerProps {
  animations: ActiveAnim[]
}

export const AnimationLayer: React.FC<AnimationLayerProps> = ({ animations }) => {
  if (animations.length === 0) return null

  return createPortal(
    <div className="animation-layer">
      {animations.map(({ id, anim, phase }) => {
        if (anim.type === 'card-fly') {
          const dur = anim.duration ?? 450
          const isRunning = phase === 'running'
          const rect = isRunning ? anim.to : anim.from
          return (
            <div
              key={id}
              className="anim-card-fly"
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                opacity: isRunning ? 0 : 1,
                transition: `left ${dur}ms ease-out, top ${dur}ms ease-out, width ${dur}ms ease-out, height ${dur}ms ease-out, opacity ${dur}ms ease-in`,
              }}
            >
              <img src={anim.imageUrl} alt="" />
            </div>
          )
        }

        if (anim.type === 'cube-move') {
          const dur = anim.duration ?? 350
          const isRunning = phase === 'running'
          const rect = isRunning ? anim.to : anim.from
          return (
            <div
              key={id}
              className="anim-cube-move"
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                backgroundColor: anim.color,
                opacity: isRunning ? 0.3 : 1,
                transition: `left ${dur}ms ease-out, top ${dur}ms ease-out, opacity ${dur}ms ease-in`,
              }}
            />
          )
        }

        if (anim.type === 'row-slide') {
          const isRunning = phase === 'running'
          const stagger = anim.staggerDelay ?? 150
          const slideDur = anim.slideDuration ?? 500
          const removedIdx = anim.removedIndex
          const rects = anim.cardRects
          const htmls = anim.cardHtmls
          const cardsToSlide = rects.length - removedIdx - 1
          const newCardDelay = stagger * cardsToSlide + slideDur

          return (
            <React.Fragment key={id}>
              {/* Static clones for cards to the LEFT of removed card */}
              {rects.map((rect, i) => {
                if (i >= removedIdx) return null
                return (
                  <div
                    key={`static-${id}-${i}`}
                    className="anim-dom-clone"
                    style={{
                      position: 'fixed',
                      left: rect.left,
                      top: rect.top,
                      width: rect.width,
                      height: rect.height,
                      zIndex: 800,
                      pointerEvents: 'none',
                    }}
                    dangerouslySetInnerHTML={{ __html: htmls[i] || '' }}
                  />
                )
              })}

              {/* Sliding clones for cards to the RIGHT of removed card */}
              {rects.map((rect, i) => {
                if (i <= removedIdx) return null
                const targetRect = rects[i - 1]!
                const delay = stagger * (i - removedIdx - 1)
                const currentLeft = isRunning ? targetRect.left : rect.left
                const currentTop = isRunning ? targetRect.top : rect.top
                return (
                  <div
                    key={`slide-${id}-${i}`}
                    className="anim-dom-clone"
                    style={{
                      position: 'fixed',
                      left: currentLeft,
                      top: currentTop,
                      width: rect.width,
                      height: rect.height,
                      zIndex: 800,
                      pointerEvents: 'none',
                      transition: isRunning
                        ? `left ${slideDur}ms ease-out ${delay}ms, top ${slideDur}ms ease-out ${delay}ms`
                        : 'none',
                      willChange: 'left, top',
                    }}
                    dangerouslySetInnerHTML={{ __html: htmls[i] || '' }}
                  />
                )
              })}

              {/* New card fading in at the last position */}
              {anim.newCardHtml && anim.deckRect && (
                <div
                  className="anim-dom-clone"
                  style={{
                    position: 'fixed',
                    left: rects[rects.length - 1]?.left ?? anim.deckRect.left,
                    top: rects[rects.length - 1]?.top ?? anim.deckRect.top,
                    width: rects[0]?.width ?? anim.deckRect.width,
                    height: rects[0]?.height ?? anim.deckRect.height,
                    opacity: isRunning ? 1 : 0,
                    zIndex: 799,
                    pointerEvents: 'none',
                    transition: isRunning
                      ? `opacity 500ms ease-in ${newCardDelay}ms`
                      : 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: anim.newCardHtml }}
                />
              )}

              {/* Static deck clone */}
              {anim.deckRect && anim.deckHtml && (
                <div
                  className="anim-dom-clone"
                  style={{
                    position: 'fixed',
                    left: anim.deckRect.left,
                    top: anim.deckRect.top,
                    width: anim.deckRect.width,
                    height: anim.deckRect.height,
                    zIndex: 798,
                    pointerEvents: 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: anim.deckHtml }}
                />
              )}
            </React.Fragment>
          )
        }

        return null
      })}
    </div>,
    document.body
  )
}
