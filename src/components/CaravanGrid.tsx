/**
 * CaravanGrid component
 * Displays player's caravan as a 10-box grid (2 rows × 5 columns)
 * Spices fill in ascending value order: Y → R → G → B
 */

import React, { useMemo } from 'react'
import { SpiceCollection, SpiceType } from '../types'
import './CaravanGrid.css'

interface CaravanGridProps {
  caravan: SpiceCollection
  maxCapacity?: number
  onCubeClick?: (type: SpiceType, index: number) => void
  pickedCubeIndex?: number | null
  usedIndices?: Set<number>
}

const SPICE_COLORS: Record<SpiceType, string> = {
  yellow: '#FFD700',  // Gold
  red: '#DC143C',     // Crimson
  green: '#228B22',   // Forest Green
  brown: '#8B4513'    // Saddle Brown
}

const CaravanGridInner: React.FC<CaravanGridProps> = ({
  caravan,
  maxCapacity = 10,
  onCubeClick,
  pickedCubeIndex = null,
  usedIndices,
}) => {
  // Convert spice collection to ordered array
  const spiceArray = useMemo(() => {
    const spices: (SpiceType | null)[] = []
    
    // Add spices in ascending value order: Y, R, G, B
    for (let i = 0; i < caravan.yellow; i++) spices.push('yellow')
    for (let i = 0; i < caravan.red; i++) spices.push('red')
    for (let i = 0; i < caravan.green; i++) spices.push('green')
    for (let i = 0; i < caravan.brown; i++) spices.push('brown')
    
    // Fill remaining slots with null (empty boxes)
    while (spices.length < maxCapacity) {
      spices.push(null)
    }
    
    return spices
  }, [caravan, maxCapacity])

  return (
    <div className="caravan-grid" role="grid" aria-label="Caravan spice grid">
      {spiceArray.map((spice, index) => {
        const isPicked = pickedCubeIndex === index
        const isUsed = usedIndices?.has(index) ?? false
        const isClickable = !!onCubeClick && !!spice && !isUsed
        return (
          <div
            key={index}
            className={`caravan-box ${spice ? 'filled' : 'empty'} ${isPicked ? 'picked' : ''} ${isUsed ? 'used' : ''} ${isClickable ? 'clickable' : ''}`}
            data-spice={spice || 'empty'}
            style={{
              backgroundColor: spice ? SPICE_COLORS[spice] : 'transparent',
              borderColor: spice ? SPICE_COLORS[spice] : '#ccc'
            }}
            title={spice ? `${spice} spice` : 'empty slot'}
            aria-label={spice ? `${spice} spice cube, slot ${index + 1}` : `Empty slot ${index + 1}`}
            role="gridcell"
            tabIndex={isClickable ? 0 : -1}
            onClick={() => isClickable && onCubeClick!(spice!, index)}
            onKeyDown={(e) => { if (isClickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onCubeClick!(spice!, index) } }}
          />
        )
      })}
    </div>
  )
}

/**
 * Custom comparison: only re-render when caravan spice values, capacity,
 * pickedCubeIndex, usedIndices, or onCubeClick reference actually change.
 */
function caravanPropsAreEqual(prev: CaravanGridProps, next: CaravanGridProps): boolean {
  if (prev.maxCapacity !== next.maxCapacity) return false
  if (prev.pickedCubeIndex !== next.pickedCubeIndex) return false
  if (prev.onCubeClick !== next.onCubeClick) return false
  // Compare caravan spice values
  if (prev.caravan.yellow !== next.caravan.yellow) return false
  if (prev.caravan.red !== next.caravan.red) return false
  if (prev.caravan.green !== next.caravan.green) return false
  if (prev.caravan.brown !== next.caravan.brown) return false
  // Compare usedIndices sets
  const prevUsed = prev.usedIndices
  const nextUsed = next.usedIndices
  if (prevUsed === nextUsed) return true
  if (!prevUsed || !nextUsed) return false
  if (prevUsed.size !== nextUsed.size) return false
  for (const idx of prevUsed) {
    if (!nextUsed.has(idx)) return false
  }
  return true
}

export const CaravanGrid = React.memo(CaravanGridInner, caravanPropsAreEqual)
