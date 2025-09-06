use std::fmt;

use crate::Number;

/// A sudoku cell. It can contain multiple possibilities.
///
/// ### Example
///
/// ```
/// use sudoku::{Field, Number};
///
/// let mut cell = Field::full();
/// cell.remove(Number::N1);
/// cell.remove(Number::N4);
///
/// assert!(cell.contains(Number::N2));
/// assert!(cell.solution().is_none());
/// assert_eq!(cell.len(), 7);
///
/// cell.set(Number::N5);
///
/// assert_eq!(cell.solution(), Some(Number::N5));
/// ```
#[derive(Copy, Clone, PartialEq, Eq)]
pub struct Field(u16);

impl fmt::Debug for Field {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.is_empty() {
            f.write_str("         ")
        } else if let Some(solution) = self.solution() {
            f.write_str(solution.as_str())?;
            f.write_str("        ")
        } else {
            for n in crate::number::ALL {
                if self.contains(n) {
                    f.write_str(n.as_str_small())?;
                } else {
                    f.write_str(" ")?;
                }
            }
            Ok(())
        }
    }
}

impl Field {
    /// Creates a sudoku cell containing only the provided number
    pub fn new(n: u8) -> Self {
        Field(Number::new(n).as_bit())
    }

    /// Creates an unconstrained sudoku cell, which can contain any number
    pub fn full() -> Self {
        Field(0b111_111_111)
    }

    /// Whether the sudoku cell is empty -- meaning that it cannot contain
    /// any number, and the sudoku is unsolvable
    pub fn is_empty(&self) -> bool {
        self.0 == 0
    }

    /// Returns an iterator over all possible numbers in this sudoku cell
    pub fn possibilities(self) -> impl Iterator<Item = Number> {
        // TODO: Use a 'static slice instead?
        static BIT_LUT: [Option<Number>; 1 << 9] = {
            let mut lut = [None; 1 << 9];
            let mut i = 0u16;
            while i < lut.len() as u16 {
                lut[i as usize] = Number::from_smallest_bit(i);
                i += 1;
            }
            lut
        };

        let mut n = self.0;
        std::iter::from_fn(move || {
            let next = BIT_LUT[n as usize];
            if let Some(next) = next {
                n -= next.as_bit();
            }
            next
        })
    }

    /// Returns the number of possibilities in this sudoku cell
    pub fn len(&self) -> u32 {
        self.0.count_ones()
    }

    /// Returns the number in this sudoku cell, if it has exactly one
    /// possibility
    pub fn solution(self) -> Option<Number> {
        static BIT_LUT: [Option<Number>; 1 << 9] = {
            let mut lut = [None; 1 << 9];
            let mut i = 0u16;
            while i < lut.len() as u16 {
                lut[i as usize] = if i.is_power_of_two() {
                    Number::from_smallest_bit(i)
                } else {
                    None
                };
                i += 1;
            }
            lut
        };

        BIT_LUT[self.0 as usize]
    }

    /// Returns whether `n` is possible in the sudoku cell
    pub fn contains(self, n: Number) -> bool {
        self.0 & n.as_bit() != 0
    }

    /// Sets `n` as the solution for this sudoku cell
    pub fn set(&mut self, n: Number) {
        self.0 = n.as_bit();
    }

    /// Removes `n` from the list of possibilities in this sudoku cell
    pub fn remove(&mut self, n: Number) {
        self.0 &= 0b111_111_111 - n.as_bit();
    }
}
