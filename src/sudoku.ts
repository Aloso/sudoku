import { Cell, Value } from './cell'

export enum Method {
  Hint = 'hint',
  Normal = 'normal',
  Marked = 'marked',
}

export class Sudoku {
  readonly elem = document.createElement('div')
  readonly table = document.createElement('table')

  readonly rows: Cell[][] = []
  readonly cols: Cell[][] = []
  readonly blocks: Cell[][] = []

  private sel: Cell | null = null
  private met: Method = Method.Normal

  private focused: number[] = []
  private hasErrors = false

  constructor(
    readonly size = 9,
    readonly blockWidth = 3,
    readonly blockHeight = 3,
  ) {
    const tbody = document.createElement('tbody')

    const changeCell = (row: number, col: number, v: Value) => {
      this.focus(v)
      this.highlightErrors()
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
        this.sel.elem.classList.remove(this.met)
      }
      this.sel = selected
      if (this.sel != null) {
        this.sel.elem.classList.add('selected')
        this.sel.elem.classList.add(this.met)
      }
    }
  }

  get method(): Method {
    return this.met
  }

  set method(method: Method) {
    if (method !== this.met) {
      if (this.sel != null) this.sel.elem.classList.remove(this.met)
      this.met = method
      if (this.sel != null) this.sel.elem.classList.add(this.met)
    }
  }

  focus(val: Value) {
    this.focused.forEach(f => this.elem.classList.remove('f' + f))
    if (val == null) {
      this.focused = []
    } else if (typeof val === 'number') {
      this.focused = [val]
      this.elem.classList.add('f' + val)
    } else {
      this.focused = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => {
        if (val[n]) this.elem.classList.add('f' + n)
        else this.elem.classList.remove('f' + n)
        return val[n]
      })
    }
  }

  autofill() {
    this.rows.forEach(row => row.forEach(cell => cell.fillAllHints()))
    this.rows.forEach(row => row.forEach(cell => cell.clearSameHints()))
    this.rows.forEach(row => row.forEach(cell => cell.update()))
  }

  highlightErrors() {
    this.elem.querySelectorAll('td.error').forEach(el => el.classList.remove('error'))

    this.hasErrors = false
    this.rows.forEach(row => row.forEach(cell => {
      this.hasErrors = cell.highlightErrorIfWrong() || this.hasErrors
    }))
  }
}
