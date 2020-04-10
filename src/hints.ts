import { Num, Bit, allBits } from './numbers'


export const MAX_HINTS = (1 << 9) - 1

// const numBuffer: { [key: number]: Num[] } = []
const bitBuffer: { [key: number]: Bit[] } = []

for (let i = 0; i <= MAX_HINTS; i++) {
  // numBuffer[i] = allNums.filter(n => (toBit[n] & i) > 0)
  bitBuffer[i] = allBits.filter(n => (n & i) > 0)
}


export class Hints {

  private val = 0

  get bits(): Bit[] {
    return bitBuffer[this.val]
  }

  get len(): 0 | Num {
    return bitBuffer[this.val].length as 0 | Num
  }

  has(n: Bit): boolean {
    return (this.val & n) > 0
  }

  set(n: Bit) {
    this.val |= n
  }

  remove(n: Bit) {
    this.val &= ~n
  }

  toggle(n: Bit) {
    this.val ^= n
  }

  intersects(hints: Hints): boolean {
    return (this.val & hints.val) > 0
  }

  isSubsetOf(hints: Hints): boolean {
    return (this.val & hints.val) === this.val
  }

  fill() {
    this.val = MAX_HINTS
  }
}
