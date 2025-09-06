mod field;
mod generate;
mod grid;
mod number;
mod pos;
mod solve;

pub use field::Field;
pub use generate::generate;
pub use grid::Grid;
pub use number::Number;
pub use pos::Pos;
pub use solve::{SolveOptions, solve};

#[macro_export]
macro_rules! row {
    (field $n:literal) => {
        $crate::Field::new($n)
    };
    (field _) => {
        $crate::Field::full()
    };
    ($($t:tt)*) => {
        [$( row!(field $t) ),*]
    }
}
