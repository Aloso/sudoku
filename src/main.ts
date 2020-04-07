import { Sudoku } from './sudoku'

const sudoku = new Sudoku()


const content = document.getElementById('content-inner')!
content.innerHTML = ''
content.append(sudoku.elem)

let mode: 'initial' | 'solve' = 'initial'

window.addEventListener('keydown', e => {
  if (sudoku.selected != null) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (mode === 'initial' || !sudoku.selected.elem.classList.contains('initial')) {
        sudoku.selected.value = null
      }
    } else if (!isNaN(+e.key)) {
      const val = +e.key
      e.preventDefault()
      if (sudoku.method === 'hint') {
        sudoku.selected.toggleHint(val)
      } else if (mode === 'initial' || !sudoku.selected.elem.classList.contains('initial')) {
        sudoku.selected.value = val
        sudoku.focus(val)
        if (mode === 'initial') {
          sudoku.selected.elem.classList.add('initial')
        }
      }
    } else if (e.key === 'i') {
      mode = mode === 'initial' ? 'solve' : 'initial'
    }
  }
  if (e.key === 'a') {
    sudoku.autofill()
  }
})

function init(matrix: string[]) {
  for (let ri = 0; ri < sudoku.rows.length; ++ri) {
    const row = sudoku.rows[ri]
    const mat = matrix[ri].split(/ +/g)

    for (let ci = 0; ci < row.length; ++ci) {
      const v = mat[ci]
      if (v !== '-') {
        row[ci].value = +v
        row[ci].elem.classList.add('initial')
      }
    }
  }
}

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
mode = 'solve'
