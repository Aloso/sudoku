use crate::Grid;

#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub struct SolveOptions {
    /// Number of solutions after which we can stop looking for more.
    /// Due to the recursive implementation, the function may return more
    /// solutions than asked.
    pub max_solutions: usize,
}

impl Default for SolveOptions {
    fn default() -> Self {
        Self { max_solutions: 1 }
    }
}

/// Solves the sudoku grid, putting all discovered solutions in the `acc`
/// vector.
///
/// By default, only the first solution is provided, after which we stop looking
/// for more. This behaviour can be changed by setting the `max_solutions` field
/// in [SolveOptions].
pub fn solve(grid: &Grid, acc: &mut Vec<Grid>, options: SolveOptions) {
    brute_force(grid, acc, options.max_solutions);
}

pub(super) fn brute_force(grid: &Grid, acc: &mut Vec<Grid>, max_solutions: usize) {
    let Some(pos) = grid.best_field_to_guess() else {
        acc.push(grid.clone());
        return;
    };

    let field = grid[pos];

    for num in field.possibilities() {
        let mut copy = grid.clone();

        let is_empty = copy.set(pos, num);
        if is_empty {
            continue;
        }
        brute_force(&copy, acc, max_solutions);
        if acc.len() >= max_solutions {
            break;
        }
    }
}
