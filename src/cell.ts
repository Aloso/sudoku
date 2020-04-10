import { CellType, Sudoku } from './sudoku'
import { Hints } from './hints'
import { Bit, fromBit } from './numbers'

export type Value =
  | null
  | Bit
  | Hints

function hintsToString(hints: Hints): string {
  return `<table class="hints">
    <tr>
      <td class="c1${!hints.has(1) ? ' hide' : ''}">1</td>
      <td class="c2${!hints.has(2) ? ' hide' : ''}">2</td>
      <td class="c4${!hints.has(4) ? ' hide' : ''}">3</td>
    </tr>
    <tr>
      <td class="c8${!hints.has(8) ? ' hide' : ''}">4</td>
      <td class="c16${!hints.has(16) ? ' hide' : ''}">5</td>
      <td class="c32${!hints.has(32) ? ' hide' : ''}">6</td>
    </tr>
    <tr>
      <td class="c64${!hints.has(64) ? ' hide' : ''}">7</td>
      <td class="c128${!hints.has(128) ? ' hide' : ''}">8</td>
      <td class="c256${!hints.has(256) ? ' hide' : ''}">9</td>
    </tr>
  </table>`
}

export class Cell {
  readonly elem = document.createElement('td')

  private val: Value = null
  private ty: CellType = CellType.Normal

  constructor(
    private readonly sudoku: Sudoku,
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
        if (this.sudoku.nextType !== CellType.Init || e.button !== 0) {
          this.sudoku.nextType = [CellType.Normal, CellType.Mark, CellType.Hint][e.button]
        }
        this.sudoku.selected = this
        this.sudoku.focus(this.val)
      }
    })
  }

  get value(): Value {
    return this.val
  }

  set value(newValue: Value) {
    if (newValue !== this.val) {
      if (typeof this.val === 'number') {
        this.elem.classList.remove('c' + this.val)
      }

      this.val = newValue

      if (typeof this.val === 'number') {
        this.elem.classList.add('c' + this.val)
      }
      this.updateContent()
    }
  }

  get type(): CellType {
    return this.ty
  }

  set type(ty: CellType) {
    if (ty !== this.ty) {
      if (this.ty === CellType.Init) {
        this.elem.classList.remove('init')
      } else if (this.ty === CellType.Mark) {
        this.elem.classList.remove('mark')
      } else if (this.ty === CellType.Hint) {
        this.elem.classList.remove('hint')
      }

      this.ty = ty

      if (this.ty === CellType.Init) {
        this.elem.classList.add('init')
      } else if (this.ty === CellType.Mark) {
        this.elem.classList.add('mark')
      } else if (this.ty === CellType.Hint) {
        this.elem.classList.add('hint')
      }
    }
  }

  toggleHint(hint: Bit) {
    this.type = CellType.Hint

    if (!(this.val instanceof Hints)) this.val = new Hints()
    this.val.toggle(hint)

    this.updateContent()
  }

  fillAllHints() {
    if (this.val instanceof Hints) {
      this.val.fill()
    } else if (this.val == null) {
      this.val = new Hints()
      this.val.fill()
    }
  }

  removeHint(bit: Bit) {
    if (this.val instanceof Hints) {
      this.val.remove(bit)
    }
  }

  clearSameHints() {
    const val = this.val
    if (val != null && typeof val === 'number') {
      this.sudoku.rows[this.row].forEach(cell => cell.removeHint(val))
      this.sudoku.cols[this.col].forEach(cell => cell.removeHint(val))
      this.sudoku.blocks[this.blockIdx].forEach(cell => cell.removeHint(val))
    }
  }

  update() {
    this.elem.className = this.elem.className.replace(/c\d+\s*/g, '')
    if (typeof this.val === 'number') {
      this.elem.classList.add('c' + this.val)
      if (this.ty === CellType.Hint) this.type = CellType.Normal
    } else if (typeof this.val === 'object') {
      this.type = CellType.Hint
    } else {
      this.type = CellType.Normal
    }

    this.updateContent()
  }

  highlightAndDeleteErrorIfWrong() {
    if (this.val != null) {
      const numsInDomain = this.numbersInDomain()

      if (this.val instanceof Hints) {
        const hints = this.val

        numsInDomain.bits.forEach(n => {
          if (hints.has(n)) {
            if (this.sudoku.autoDeleteErrorHints) {
              hints.remove(n)
              this.update()
            } else {
              this.highlightHintError(n)
            }
          }
        })
      } else {
        const error = numsInDomain.has(this.val)
        if (error) this.highlightError()
        return error
      }
    }
  }

  highlightError() {
    this.elem.classList.add('error')
  }

  highlightHintError(hint: Bit) {
    this.elem.querySelector(`.c${hint}`)?.classList?.add('error')
  }

  numbersInDomain(): Hints {
    const nums = new Hints()

    const callback = (cell: Cell) => {
      if (cell !== this && typeof cell.val === 'number') nums.set(cell.val)
    }

    this.sudoku.rows[this.row].forEach(callback)
    this.sudoku.cols[this.col].forEach(callback)
    this.sudoku.blocks[this.blockIdx].forEach(callback)

    return nums
  }

  getDomainCells(): [Cell[], Cell[], Cell[]] {
    return [
      this.sudoku.rows[this.row],
      this.sudoku.cols[this.col],
      this.sudoku.blocks[this.blockIdx],
    ]
  }

  highlightNakedAndHidden() {
    if (this.ty === CellType.Hint) {
      const hints = this.val as Hints
      const nakedCount = hints.len

      if (nakedCount === 1) {
        this.highlightTip()
      } else {
        hints.bits.forEach(bit => {
          const callback = (cell: Cell): boolean =>
            cell === this || !(cell.val instanceof Hints) || !cell.val.has(bit)

          if (
            this.sudoku.rows[this.row].every(callback) ||
            this.sudoku.cols[this.col].every(callback) ||
            this.sudoku.blocks[this.blockIdx].every(callback)
          ) {
            this.highlightHintTip(bit)
          } else {
            for (const cells of this.getDomainCells()) {
              const hiddenSiblings: Cell[] = []
              const otherHintSiblings: Cell[] = []

              for (const cell of cells) {
                if (cell !== this && cell.val instanceof Hints) {
                  if (cell.val.isSubsetOf(hints)) {
                    if (cell.val.len > 1) hiddenSiblings.push(cell)
                  } else {
                    otherHintSiblings.push(cell)
                  }
                }
              }

              if (
                hiddenSiblings.length >= nakedCount - 1 &&
                otherHintSiblings.some((c) => (c.val as Hints).intersects(hints))
              ) {
                for (const sib of otherHintSiblings) {
                  const bits = (sib.val as Hints).bits.filter(b => hints.has(b))
                  if (bits.length) sib.highlightHintTips(bits.map(n => `.c${n}`).join(', '), 'warn')
                }
              }
            }
          }
        })
      }
    }
  }

  highlightTip(cssClass: 'tip' | 'warn' = 'tip') {
    this.elem.classList.add(cssClass)
  }

  highlightHintTip(bit: Bit, cssClass: 'tip' | 'warn' = 'tip') {
    this.elem.querySelector(`.c${bit}`)?.classList?.add(cssClass)
  }

  highlightHintTips(hintSelector: string, cssClass: 'tip' | 'warn' = 'tip') {
    this.elem.querySelectorAll(hintSelector).forEach(h => h.classList.add(cssClass))
  }

  private updateContent() {
    if (this.val instanceof Hints) {
      this.elem.innerHTML = hintsToString(this.val)
    } else if (this.val == null) {
      this.elem.innerHTML = ''
    } else {
      this.elem.innerHTML = '' + fromBit[this.val]
    }
    this.onChange(this.row, this.col, this.val)
  }
}
