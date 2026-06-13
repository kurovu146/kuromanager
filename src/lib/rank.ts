export const RANK_STEP = 1024

/**
 * Tính rank cho item chèn giữa `prev` và `next` (theo thứ tự hiển thị).
 * - Cả hai undefined: danh sách rỗng → 0
 * - Chỉ prev: chèn cuối → prev + STEP
 * - Chỉ next: chèn đầu → next - STEP
 * - Cả hai: trung bình
 */
export function computeRank(prev: number | undefined, next: number | undefined): number {
  if (prev === undefined && next === undefined) return 0
  if (next === undefined) return prev! + RANK_STEP
  if (prev === undefined) return next - RANK_STEP
  return (prev + next) / 2
}
