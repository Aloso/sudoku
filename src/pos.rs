use std::fmt;

/// A position in a 9x9 sudoku grid. It can be used to index
/// [Grid](super::Grid).
///
/// To iterate over all positions, use [Pos::iterator()].
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
#[repr(align(2))]
pub struct Pos {
    x: u8,
    y: u8,
}

impl Pos {
    /// Creates a sudoku position from `x` (column) and `y` (row) coordinates.
    /// The coordinates start with 0, so they must be at most 8.
    pub fn new(x: u8, y: u8) -> Self {
        if x > 8 || y > 8 {
            panic!("x={x} or y={y} is too large");
        }
        Pos { x, y }
    }

    /// Returns an iterator over all positions in a 9x9 sudoku grid.
    pub fn iterator() -> impl Iterator<Item = Pos> {
        static ALL_POS: [Pos; 81] = {
            let mut result = [Pos { x: 0, y: 0 }; 81];
            let mut x = 0;
            while x < 9 {
                let mut y = 0;
                while y < 9 {
                    result[(x * 9 + y) as usize] = Pos { x, y };
                    y += 1;
                }
                x += 1;
            }
            result
        };
        ALL_POS.into_iter()
    }

    /// Returns the zero-based `x` (column) coordinate.
    pub fn x(self) -> u8 {
        self.x
    }

    /// Returns the zero-based `y` (row) coordinate.
    pub fn y(self) -> u8 {
        self.y
    }

    /// Returns all the positions that are visible from this position, assuming
    /// standard Sudoku rules:
    ///
    /// - all cells in the same block
    /// - all cells in the same row and column
    /// - _not_ including the cell at the current position (`self`)
    pub fn get_visible_positions(self) -> [Pos; 20] {
        static POS_LUT: [[Pos; 20]; 81] = {
            let mut results = [[Pos { x: 0, y: 0 }; 20]; 81];
            let mut x = 0;
            while x < 9 {
                let mut y = 0;
                while y < 9 {
                    results[(x * 9 + y) as usize] = visible_positions(Pos { x, y });
                    y += 1;
                }
                x += 1;
            }
            results
        };

        POS_LUT[(self.x * 9 + self.y) as usize]
    }
}

const fn visible_positions(pos: Pos) -> [Pos; 20] {
    let mut results = [Pos { x: 0, y: 0 }; 20];
    let mut i = 0;

    // in block
    let block_x = pos.x - (pos.x % 3);
    let block_y = pos.y - (pos.y % 3);
    let mut x = block_x;
    while x < block_x + 3 {
        let mut y = block_y;
        while y < block_y + 3 {
            if x != pos.x || y != pos.y {
                results[i] = Pos { x, y };
                i += 1;
            }
            y += 1;
        }
        x += 1;
    }

    // same row
    let mut ci = 0;
    while ci < 9 {
        if ci < block_x || ci >= block_x + 3 {
            results[i] = Pos { x: ci, y: pos.y };
            i += 1;
        }
        ci += 1;
    }

    // same column
    let mut ri = 0;
    while ri < 9 {
        if ri < block_y || ri >= block_y + 3 {
            results[i] = Pos { x: pos.x, y: ri };
            i += 1;
        }
        ri += 1;
    }

    results
}

impl fmt::Debug for Pos {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({x}, {y})", x = self.x, y = self.y)
    }
}

#[test]
fn test_visible_positions() {
    assert_eq!(
        visible_positions(Pos::new(2, 5)),
        [
            Pos::new(0, 3),
            Pos::new(0, 4),
            Pos::new(0, 5),
            Pos::new(1, 3),
            Pos::new(1, 4),
            Pos::new(1, 5),
            Pos::new(2, 3),
            Pos::new(2, 4),
            Pos::new(3, 5),
            Pos::new(4, 5),
            Pos::new(5, 5),
            Pos::new(6, 5),
            Pos::new(7, 5),
            Pos::new(8, 5),
            Pos::new(2, 0),
            Pos::new(2, 1),
            Pos::new(2, 2),
            Pos::new(2, 6),
            Pos::new(2, 7),
            Pos::new(2, 8),
        ]
    );
}
