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
        if (this.parent.nextType !== CellType.Init || e.button !== 0) {
          this.parent.nextType = [CellType.Normal, CellType.Mark, CellType.Hint][e.button]
        }
        this.parent.selected = this
        this.parent.focus(this.val)
      }
    })
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
      this.parent.rows[this.row].forEach(cell => cell.removeHint(val))
      this.parent.cols[this.col].forEach(cell => cell.removeHint(val))
      this.parent.blocks[this.blockIdx].forEach(cell => cell.removeHint(val))
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

  highlightErrorIfWrong(): boolean {
    if (this.val != null) {
      const numsInDomain = this.numbersInDomain()

      if (typeof this.val === 'number') {
        const error = numsInDomain.has(this.val)
        if (error) this.highlightError()
        return error
      } else {
        const value: Hints = this.val
        let error = false

        numsInDomain.bits.forEach(n => {
          if (value.has(n)) {
            this.highlightHintError(n)
            error = true
          }
        })
        return error
      }
    }
    return false
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

    this.parent.rows[this.row].forEach(callback)
    this.parent.cols[this.col].forEach(callback)
    this.parent.blocks[this.blockIdx].forEach(callback)

    return nums
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
            this.parent.rows[this.row].every(callback) ||
            this.parent.cols[this.col].every(callback) ||
            this.parent.blocks[this.blockIdx].every(callback)
          ) {
            this.highlightHintTip(bit)
          } else {
            [
              this.parent.rows[this.row],
              this.parent.cols[this.col],
              this.parent.blocks[this.blockIdx],
            ].forEach((cells: Cell[]) => {
              const colHiddenSiblings: Cell[] = []
              const colHiddenNotSiblings: Cell[] = []

              for (const cell of cells) {
                if (cell !== this && cell.val instanceof Hints) {
                  if (cell.val.isSubsetOf(hints)) {
                    colHiddenSiblings.push(cell)
                  } else {
                    colHiddenNotSiblings.push(cell)
                  }
                }
              }

              if (
                colHiddenSiblings.length >= nakedCount - 1 &&
                colHiddenNotSiblings.some((c) => (c.val as Hints).intersects(hints))
              ) {
                const hintSelector = hints.bits.map(n => `.c${n}`).join(', ')

                this.highlightHintTips(hintSelector)
                colHiddenSiblings.forEach(sib => sib.highlightHintTips(hintSelector))
              }
            })
          }
        })
      }
    }
  }

  highlightTip() {
    this.elem.classList.add('tip')
  }

  highlightHintTip(bit: Bit) {
    this.elem.querySelector(`.c${bit}`)?.classList?.add('tip')
  }

  highlightHintTips(hintSelector: string) {
    this.elem.querySelectorAll(hintSelector).forEach(h => h.classList.add('tip'))
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
