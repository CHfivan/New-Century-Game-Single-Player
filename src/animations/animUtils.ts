/**
 * Animation utility helpers
 */

import { AnimRect } from './AnimationLayer'

/** Get the bounding rect of a DOM element as an AnimRect */
export function getElementRect(el: Element | null): AnimRect | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

/** Get rect by CSS selector */
export function getRectBySelector(selector: string): AnimRect | null {
  return getElementRect(document.querySelector(selector))
}

/** Create a small rect centered at a point (for cube animations) */
export function cubeRect(x: number, y: number, size: number = 16): AnimRect {
  return { left: x - size / 2, top: y - size / 2, width: size, height: size }
}

/** Get the center point of an AnimRect */
export function rectCenter(r: AnimRect): { x: number; y: number } {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
