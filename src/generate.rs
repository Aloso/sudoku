use rand::seq::IndexedRandom;

use crate::{Grid, Number, Pos, solve::brute_force};

/// Generates a full sudoku grid that is
///
/// - valid: following standard Sudoku rules
/// - random: every possible sudoku grid is equally likely
///
/// To generate a sudoku with empty fields, you need to remove numbers, and
/// then check if it is still uniquely solvable.
///
/// Warning: The number of empty squares is NOT a good indicator for the
/// Sudoku's difficulty.
pub fn generate(rng: &mut impl rand::Rng) -> Grid {
    let mut pos_acc = Vec::with_capacity(81);
    let mut num_acc = Vec::with_capacity(9);
    let mut grid_acc = Vec::new();

    'outer: loop {
        let mut grid = Grid::full();
        let mut was_valid = false;

        for _ in 0..26 {
            if let AddedResult::Failed = add_random(&mut grid, &mut pos_acc, &mut num_acc, rng) {
                continue 'outer;
            }
        }

        grid_acc.clear();
        brute_force(&grid, &mut grid_acc, 2);
        if grid_acc.len() == 1 {
            return grid_acc.pop().unwrap();
        } else if grid_acc.is_empty() {
            continue 'outer;
        }

        loop {
            let mut copy = grid.clone();
            match add_random(&mut copy, &mut pos_acc, &mut num_acc, rng) {
                AddedResult::Success => {}
                AddedResult::Failed => continue,
                AddedResult::Full => return copy,
            }

            grid_acc.clear();
            brute_force(&copy, &mut grid_acc, 2);
            if grid_acc.len() == 1 {
                return grid_acc.pop().unwrap();
            } else if grid_acc.is_empty() {
                if was_valid {
                    continue;
                }
                continue 'outer;
            }

            grid = copy;
            was_valid = true;
        }
    }
}

enum AddedResult {
    Success,
    Failed,
    Full,
}

fn add_random(
    grid: &mut Grid,
    pos_acc: &mut Vec<Pos>,
    num_acc: &mut Vec<Number>,
    rng: &mut impl rand::Rng,
) -> AddedResult {
    grid.all_unsolved_fields(pos_acc);
    let Some(&pos) = pos_acc.choose(rng) else {
        return AddedResult::Full;
    };

    num_acc.clear();
    num_acc.extend(grid[pos].possibilities());
    let &num = num_acc.choose(rng).unwrap();

    let is_empty = grid.set(pos, num);
    if is_empty {
        AddedResult::Failed
    } else {
        AddedResult::Success
    }
}
