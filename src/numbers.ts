export type Num = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

// export const allNums: Num[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export type Bit = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256

export const allBits: Bit[] = [1, 2, 4, 8, 16, 32, 64, 128, 256]

export function isNum(n: number): n is Num {
  return n >= 1 && n <= 9
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const toBit: { [n in Num]: Bit } = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256]


// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const fromBit: { [n in Bit]: Num } = new Array<number>(257).fill(0)
fromBit[1] = 1
fromBit[2] = 2
fromBit[4] = 3
fromBit[8] = 4
fromBit[16] = 5
fromBit[32] = 6
fromBit[64] = 7
fromBit[128] = 8
fromBit[256] = 9
