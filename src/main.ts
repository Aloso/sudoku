import { CellType, Sudoku } from './sudoku'
import { Bit, fromBit, isNum, Num, toBit } from './numbers'

const sudoku = new Sudoku()


const content = document.getElementById('content-inner')!
content.innerHTML = ''
content.append(sudoku.elem)

const keydownListener = (e: KeyboardEvent) => {
  const cell = sudoku.selected
  if (sudoku.canEdit(cell)) {

    if (e.key === 'Backspace') {
      e.preventDefault()
      cell.value = null

      if (cell.type === CellType.Init) {
        cell.type = CellType.Normal
      }
    } else if (isNum(+e.key)) {
      const bit = toBit[+e.key as Num]
      e.preventDefault()

      if (sudoku.nextType === CellType.Hint) {
        cell.toggleHint(bit)
      } else {
        cell.type = sudoku.nextType
        cell.value = bit
        sudoku.focus(bit)
      }
    } else if (e.key === 'i') {
      sudoku.nextType = sudoku.nextType === CellType.Init
        ? CellType.Normal
        : CellType.Init
    }
  }
  if (e.key === 'a') {
    sudoku.autofill()
  }
}

window.addEventListener('keydown', keydownListener)

if (module.hot) module.hot.addDisposeHandler(() => {
  window.removeEventListener('keydown', keydownListener)
})

function init(matrix: string[]) {
  sudoku.autoHighlightErrors = false
  sudoku.autoHighlightTips = false

  for (let ri = 0; ri < sudoku.rows.length; ++ri) {
    const row = sudoku.rows[ri]
    const mat = matrix[ri].split(/ +/g)

    for (let ci = 0; ci < row.length; ++ci) {
      const v = +mat[ci]
      if (isNum(v)) {
        row[ci].value = toBit[v]
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
