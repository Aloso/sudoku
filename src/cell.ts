import { Method, Sudoku } from './sudoku'

export type Value =
  | number
  | null
  | Hints

export interface Hints {
  [key: number]: boolean
}

function hintsToString(hints: Hints): string {
  return `<table class="hints">
    <tr>
      <td class="c1${!hints[1] ? ' hide' : ''}">1</td>
      <td class="c2${!hints[2] ? ' hide' : ''}">2</td>
      <td class="c3${!hints[3] ? ' hide' : ''}">3</td>
    </tr>
    <tr>
      <td class="c4${!hints[4] ? ' hide' : ''}">4</td>
      <td class="c5${!hints[5] ? ' hide' : ''}">5</td>
      <td class="c6${!hints[6] ? ' hide' : ''}">6</td>
    </tr>
    <tr>
      <td class="c7${!hints[7] ? ' hide' : ''}">7</td>
      <td class="c8${!hints[8] ? ' hide' : ''}">8</td>
      <td class="c9${!hints[9] ? ' hide' : ''}">9</td>
    </tr>
  </table>`
}

export class Cell {
  readonly elem = document.createElement('td')

  private val: Value = null

  constructor(
    private readonly parent: Sudoku,
    readonly row: number,
    readonly col: number,
    readonly blockIdx: number,
    private readonly onChange: (row: number, col: number, v: Value) => void,
  ) {
    this.elem.addEventListener('contextmenu', e => {
      e.preventDefault()
    })

    this.elem.addEventListener('mousedown', e => {
      e.preventDefault()
      if (e.button >= 0 && e.button <= 2) {
        this.parent.selected = this
        this.parent.method = [Method.Normal, Method.Marked, Method.Hint][e.button]
        this.parent.focus(this.val)
      }
    })
  }

  set value(newValue: Value) {
    if (newValue !== this.val) {
      this.elem.classList.remove('mark')

      if (typeof this.val === 'number') {
        this.elem.classList.remove('c' + this.val)
      }

      this.val = newValue

      if (typeof this.val === 'number') {
        this.elem.classList.add('c' + this.val)

        if (this.parent.method === Method.Marked) {
          this.elem.classList.add('mark')
        }
      }
      this.updateContent()
    }
  }

  toggleHint(hint: number) {
    this.elem.classList.remove('mark')

    if (this.val == null || typeof this.val === 'number') {
      this.val = []
    }
    this.val[hint] = !this.val[hint]
    this.updateContent()
  }

  fillAllHints() {
    if (typeof this.val !== 'number') {
      this.val = [true, true, true, true, true, true, true, true, true, true]
    }
  }

  removeHint(num: number) {
    if (this.val != null && typeof this.val !== 'number') {
      this.val[num] = false
    }
  }

  clearSameHints() {
    const val = this.val
    if (val != null && typeof val === 'number') {
      this.parent.rows[this.row].forEach(cell => cell.removeHint(val))
      this.parent.cols[this.col].forEach(cell => cell.removeHint(val))
      this.parent.blocks[this.blockIdx].forEach(cell => cell.removeHint(val))
    }
  }

  update() {
    this.elem.className = this.elem.className.replace(/c\d+\s*/g, '')
    if (typeof this.val === 'number') {
      this.elem.classList.add('c' + this.val)
    }
    this.updateContent()
  }

  highlightErrorIfWrong(): boolean {
    if (this.val != null) {
      const numsInDomain = this.numbersInDomain()

      if (typeof this.val === 'number') {
        const error = numsInDomain[this.val]
        if (error) this.elem.classList.add('error')
        return error
      } else {
        const value: Hints = this.val
        let error = false

        numsInDomain.forEach((v, i) => {
          if (v && value[i]) {
            error = true
            this.elem.querySelector(`.c${i}`)?.classList?.add('error')
          }
        })
        return error
      }
    }
    return false
  }

  numbersInDomain(): boolean[] {
    const nums = [false, false, false, false, false, false, false, false, false, false]

    const callback = (cell: Cell) => {
      if (cell !== this && typeof cell.val === 'number') nums[cell.val] = true
    }

    this.parent.rows[this.row].forEach(callback)
    this.parent.cols[this.col].forEach(callback)
    this.parent.blocks[this.blockIdx].forEach(callback)

    return nums
  }

  highlightError() {
    this.elem.classList.add('error')
    return
  }

  highlightHintError(hint: number) {
    this.elem.querySelector(`.c${hint}`)?.classList?.add('error')
    return
  }

  private updateContent() {
    const val = this.val
    this.elem.innerHTML = val === null
      ? ''
      : typeof val === 'number'
        ? '' + val
        : hintsToString(val)

    this.onChange(this.row, this.col, val)
  }
}
