import { describe, it, expect } from 'vitest'
import { computeRank, RANK_STEP } from './rank'

describe('computeRank', () => {
  it('danh sách rỗng → 0', () => {
    expect(computeRank(undefined, undefined)).toBe(0)
  })
  it('chèn cuối (chỉ có prev) → prev + STEP', () => {
    expect(computeRank(1000, undefined)).toBe(1000 + RANK_STEP)
  })
  it('chèn đầu (chỉ có next) → next - STEP', () => {
    expect(computeRank(undefined, 1000)).toBe(1000 - RANK_STEP)
  })
  it('chèn giữa → trung bình', () => {
    expect(computeRank(1000, 2000)).toBe(1500)
  })
  it('chèn giữa hai số sát nhau vẫn ra giá trị nằm giữa', () => {
    const r = computeRank(1000, 1001)
    expect(r).toBeGreaterThan(1000)
    expect(r).toBeLessThan(1001)
  })
})
