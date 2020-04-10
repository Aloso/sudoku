import { CellType, Sudoku } from './sudoku'
import { isNum, toBit } from './numbers'
import { Cell } from './cell'

const sudoku = new Sudoku()


const content = document.getElementById('content-inner')!
content.innerHTML = ''
content.append(sudoku.elem)

const keydownListener = (e: KeyboardEvent) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return

  const cell = sudoku.selected

  if (e.key === 'a') {
    e.preventDefault()
    sudoku.autofill()
  } else if (sudoku.canEditCell(cell)) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      clearCell(cell)
    } else if (e.key === 'i') {
      e.preventDefault()
      toggleInitMode()
    } else if (isNum(+e.key)) {
      e.preventDefault()
      inputNum(cell, +e.key)
    }
  }
}

function clearCell(cell: Cell) {
  cell.value = null

  if (cell.type === CellType.Init) {
    cell.type = CellType.Normal
  }
}

function toggleInitMode() {
  sudoku.nextType = sudoku.nextType === CellType.Init
    ? CellType.Normal
    : CellType.Init
}

function inputNum(cell: Cell, num: number) {
  if (isNum(num)) {
    const bit = toBit[num]

    if (sudoku.nextType === CellType.Hint) {
      cell.toggleHint(bit)
    } else {
      cell.type = sudoku.nextType
      cell.value = bit
      sudoku.focus(bit)
    }
  }
}


window.addEventListener('keydown', keydownListener)

if (module.hot) module.hot.addDisposeHandler(() => {
  window.removeEventListener('keydown', keydownListener)
})

function init(stringMatrix: string[]) {
  sudoku.autoHighlightErrors = false
  sudoku.autoHighlightTips = false

  for (let ri = 0; ri < sudoku.rows.length; ++ri) {
    const row = sudoku.rows[ri]
    const matrix = stringMatrix[ri].split(/ +/g)

    for (let ci = 0; ci < row.length; ++ci) {
      const num = +matrix[ci]
      if (isNum(num)) {
        row[ci].value = toBit[num]
        row[ci].type = CellType.Init
      }
    }
  }

  sudoku.autoHighlightErrors = true
  sudoku.autoHighlightTips = true
}

sudoku.nextType = CellType.Init
init([
  '1 - -  - - 7  - 9 -',
  '- 3 -  - 2 -  - - 8',
  '- - 9  6 - -  5 - -',
  '- - 5  3 - -  9 - -',
  '- 1 -  - 8 -  - - 2',
  '6 - -  - - 4  - - -',
  '3 - -  - - -  - 1 -',
  '- 4 -  - - -  - - 7',
  '- - 7  - - -  3 - -',
])
sudoku.nextType = CellType.Normal
