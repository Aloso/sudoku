use std::fmt;
use std::ops::{Index, IndexMut};

use crate::{Field, Number, Pos};

/// A sudoku grid, where each cell can contain multiple possibilities.
#[derive(Clone)]
pub struct Grid {
    pub(super) fields: [[Field; 9]; 9],
}

impl Grid {
    /// Create a sudoku grid, with all possibilities filled out correctly
    ///
    /// ### Example
    ///
    /// ```
    /// use sudoku::row;
    ///
    /// let grid = sudoku::Grid::new([
    ///     row![_ 7 _  _ _ 4  _ _ _],
    ///     row![_ _ _  _ 5 _  1 _ _],
    ///     row![8 _ _  _ _ _  6 _ _],
    ///     row![_ _ _  6 _ _  2 _ _],
    ///     row![_ _ 1  _ _ _  _ _ _],
    ///     row![_ 5 _  _ _ _  _ _ _],
    ///     row![2 _ _  1 _ _  _ 4 _],
    ///     row![_ _ _  3 _ _  _ 5 _],
    ///     row![6 _ _  _ 7 _  _ _ _],
    /// ]);
    /// ```
    pub fn new(fields: [[Field; 9]; 9]) -> Self {
        let mut grid = Grid { fields };
        for pos in Pos::iterator() {
            let field = grid[pos];
            if let Some(solution) = field.solution() {
                grid.set(pos, solution);
            }
        }
        grid
    }

    /// Create an unconstrained sudoku grid (no number is known, so all
    /// possibilities are filled out)
    pub fn full() -> Self {
        Grid {
            fields: [[Field::full(); 9]; 9],
        }
    }

    /// Set the cell at the given position to the given number, update the
    /// surrounding cells recursively, and return whether any updated cell
    /// is now empty (has no possible numbers).
    ///
    /// The update is done as follows: Every cell in the same row, column or
    /// block is visited, except for the cell that was just set. For each
    /// visited cell, `num` is removed from the list of possibilities.
    ///
    /// - If the cell is now empty, `true` is returned
    /// - If the cell now contains exactly 1 possibility, set it recursively
    pub fn set(&mut self, pos: Pos, num: Number) -> bool {
        let visible = pos.get_visible_positions();
        self[pos].set(num);
        for visible_pos in visible {
            let field = &mut self[visible_pos];

            if let Some(solution) = field.solution() {
                if solution == num {
                    // field would be emtpy after removing the number
                    return true;
                }
            } else {
                field.remove(num);
                if let Some(n) = field.solution() {
                    let inner_empty = self.set(visible_pos, n);
                    if inner_empty {
                        return inner_empty;
                    }
                }
            }
        }

        false
    }

    /// Returns the position of the cell where we should guess to brute-force
    /// the sudoku. It uses a simply heuristic: Of all the cells with more than
    /// one possible number, return the first one with the minimum number of
    /// possibilities.
    ///
    /// For example, if there are cells with 2 possible numbers, one of them is
    /// returned.
    ///
    /// This function returns `None` if there are no cells with more than one
    /// possible number, meaning that the sudoku is completely solved.
    pub fn best_field_to_guess(&self) -> Option<Pos> {
        let mut lowest_len = 9;
        let mut lowest_pos = None;
        for pos in Pos::iterator() {
            let field = self[pos];
            if field.solution().is_none() {
                let len = field.len();
                if len < lowest_len {
                    lowest_len = len;
                    lowest_pos = Some(pos);
                    if len <= 2 {
                        return lowest_pos;
                    }
                }
            }
        }
        lowest_pos
    }

    /// Returns all fields with more than one possible number in the `acc`
    /// argument.
    pub fn all_unsolved_fields(&self, acc: &mut Vec<Pos>) {
        acc.clear();
        for pos in Pos::iterator() {
            if self[pos].solution().is_none() {
                acc.push(pos);
            }
        }
    }
}

impl fmt::Debug for Grid {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        for (ri, row) in self.fields.iter().enumerate() {
            for (ci, field) in row.iter().enumerate() {
                write!(f, "{field:?}")?;
                if ci == 2 || ci == 5 {
                    f.write_str(" | ")?;
                } else {
                    f.write_str(", ")?;
                }
            }
            if ri == 2 || ri == 5 {
                f.write_str("\n--------------------------------|---------------------------------|--------------------------------\n")?;
            } else {
                f.write_str("\n")?;
            }
        }
        Ok(())
    }
}

impl Index<Pos> for Grid {
    type Output = Field;

    fn index(&self, index: Pos) -> &Self::Output {
        unsafe {
            self.fields
                .get_unchecked(index.y() as usize)
                .get_unchecked(index.x() as usize)
        }
    }
}

impl IndexMut<Pos> for Grid {
    fn index_mut(&mut self, index: Pos) -> &mut Self::Output {
        unsafe {
            self.fields
                .get_unchecked_mut(index.y() as usize)
                .get_unchecked_mut(index.x() as usize)
        }
    }
}
