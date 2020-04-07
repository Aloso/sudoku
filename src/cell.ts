import { CellType, Sudoku } from './sudoku'

export type Value =
  | number
  | undefined
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

  private val: Value
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
        if (error) this.highlightError()
        return error
      } else {
        const value: Hints = this.val
        let error = false

        numsInDomain.forEach((v, i) => {
          if (v && value[i]) {
            this.highlightHintError(i)
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

  highlightHintError(hint: number) {
    this.elem.querySelector(`.c${hint}`)?.classList?.add('error')
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

  private updateContent() {
    switch (typeof this.val) {
      case 'number': this.elem.innerHTML = '' + this.val
        break
      case 'object': this.elem.innerHTML = hintsToString(this.val)
        break
      case 'undefined': this.elem.innerHTML = ''
    }
    this.onChange(this.row, this.col, this.val)
  }
}
