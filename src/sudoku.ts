import { Cell, Value } from './cell'
import { Hints } from './hints'
import { allBits, Bit, fromBit, Num, toBit } from './numbers'

export enum CellType {
  Normal = 'normal',
  Init = 'init',
  Hint = 'hint',
  Mark = 'mark',
}

export class Sudoku {
  readonly elem = document.createElement('div')
  readonly table = document.createElement('table')

  readonly rows: Cell[][] = []
  readonly cols: Cell[][] = []
  readonly blocks: Cell[][] = []

  private sel: Cell | null = null
  private nextTy: CellType = CellType.Normal

  private focused: Bit[] = []

  private autoHlErrors = true
  private autoHlTips = true
  private readonly autoDelErrorHints = true

  constructor(
    readonly size = 9,
    readonly blockWidth = 3,
    readonly blockHeight = 3,
  ) {
    const tbody = document.createElement('tbody')

    const changeCell = (row: number, col: number, v: Value) => {
      this.focus(v)
      if (this.autoHlErrors) this.highlightAndDeleteErrors()
      if (this.autoHlTips) {
        this.highlightTips()
        this.highlightBlockTips()
      }
    }

    for (let i = 0; i < size; i++) {
      this.rows[i] = []
      this.cols[i] = []
      this.blocks[i] = []
    }

    const verticalBlocks = size / blockWidth

    for (let row = 0; row < size; ++row) {
      const tr = document.createElement('tr')
      if (row % blockHeight === 0) tr.classList.add('block')

      for (let col = 0; col < size; ++col) {
        const blockRow = Math.floor(row / blockHeight)
        const blockCol = Math.floor(col / blockWidth)
        const blockIdx = blockRow * verticalBlocks + blockCol

        const cell = new Cell(this, row, col, blockIdx, changeCell)
        const td = cell.elem
        if (col % blockWidth === 0) td.classList.add('block')

        this.rows[row].push(cell)
        this.cols[col].push(cell)
        this.blocks[blockIdx].push(cell)

        tr.append(td)
      }
      tbody.append(tr)
    }
    this.table.append(tbody)
    this.elem.append(this.table)
    this.elem.className = 'sudoku'
  }

  get selected(): Cell | null {
    return this.sel
  }

  set selected(selected: Cell | null) {
    if (selected !== this.sel) {
      if (this.sel != null) {
        this.sel.elem.classList.remove('selected')
        this.sel.elem.classList.remove('next-' + this.nextTy)
      }
      this.sel = selected
      if (this.sel != null) {
        this.sel.elem.classList.add('selected')
        this.sel.elem.classList.add('next-' + this.nextTy)
      }
    }
  }

  get nextType(): CellType {
    return this.nextTy
  }

  set nextType(ty: CellType) {
    if (ty !== this.nextTy) {
      if (this.sel != null) {
        this.sel.elem.classList.remove('next-' + this.nextTy)
        this.nextTy = ty
        this.sel.elem.classList.add('next-' + this.nextTy)
      } else {
        this.nextTy = ty
      }
    }
  }

  canEditCell(sel = this.sel): sel is Cell {
    return sel != null && (sel.type !== CellType.Init || this.nextTy === CellType.Init)
  }

  focus(val: Value) {
    this.focused.forEach(f => this.elem.classList.remove('f' + f))

    if (val == null) {
      this.focused = []
    } else if (val instanceof Hints) {
      this.focused = allBits.filter(bit => {
        if (val.has(bit)) this.elem.classList.add('f' + bit)
        else this.elem.classList.remove('f' + bit)
        return val.has(bit)
      })
    } else {
      this.focused = [val]
      this.elem.classList.add('f' + val)
    }
  }

  autofill() {
    const errorsBefore = this.autoHlErrors
    const tipsBefore = this.autoHlTips
    this.autoHlErrors = false
    this.autoHlTips = false

    this.rows.forEach(row => row.forEach(cell => cell.fillAllHints()))
    this.rows.forEach(row => row.forEach(cell => cell.clearSameHints()))
    this.rows.forEach(row => row.forEach(cell => cell.update()))

    this.autoHighlightErrors = errorsBefore
    this.autoHighlightTips = tipsBefore
  }

  clearErrorHighlights() {
    this.elem.querySelectorAll('td.error')
      .forEach(el => el.classList.remove('error'))
  }

  clearTipHighlights() {
    this.elem.querySelectorAll('td.tip, td.warn')
      .forEach(el => el.classList.remove('tip', 'warn'))
  }

  highlightAndDeleteErrors() {
    this.clearErrorHighlights()
    this.rows.forEach(row => row.forEach(cell => {
      cell.highlightAndDeleteErrorIfWrong()
    }))
  }

  highlightTips() {
    this.clearTipHighlights()

    this.rows.forEach(row => row.forEach(cell => {
      cell.highlightNakedAndHidden()
    }))
  }

  set autoHighlightErrors(highlight: boolean) {
    this.autoHlErrors = highlight
    if (highlight) this.highlightAndDeleteErrors()
    else this.clearErrorHighlights()
  }

  set autoHighlightTips(highlight: boolean) {
    this.autoHlTips = highlight
    if (highlight) this.highlightTips()
    else this.clearTipHighlights()
  }

  get autoDeleteErrorHints(): boolean {
    return this.autoDelErrorHints
  }

  highlightBlockTips() {
    const rows = new Hints()
    const cols = new Hints()

    for (const cells of this.blocks) {
      const hintCells = cells.filter((c) => c.value instanceof Hints)

      if (hintCells.length > 1) {
        const blockIdx = hintCells[0].blockIdx

        for (const bit of allBits) {
          rows.empty()
          cols.empty()
          for (const cell of hintCells) {
            const value = cell.value as Hints
            if (value.has(bit)) {
              rows.set(toBit[cell.row + 1 as Num])
              cols.set(toBit[cell.col + 1 as Num])
            }
          }

          if (cols.len === rows.len) continue

          if (cols.len === 1) {
            const candidates = this.cols[fromBit[cols.bits[0]] - 1]
            for (const candidate of candidates) {
              if (candidate.blockIdx !== blockIdx) {
                if (candidate.value instanceof Hints && candidate.value.has(bit)) {
                  candidate.highlightHintTip(bit, 'warn')
                }
              }
            }
          } else if (rows.len === 1) {
            const candidates = this.rows[fromBit[rows.bits[0]] - 1]
            for (const candidate of candidates) {
              if (candidate.blockIdx !== blockIdx) {
                if (candidate.value instanceof Hints && candidate.value.has(bit)) {
                  candidate.highlightHintTip(bit, 'warn')
                }
              }
            }
          }
        }
      }
    }
  }
}
