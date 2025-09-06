use std::time::Instant;

macro_rules! row {
    (field $n:literal) => {
        ::sudoku::Field::new($n)
    };
    (field _) => {
        ::sudoku::Field::full()
    };
    ($($t:tt)*) => {
        [$( row!(field $t) ),*]
    }
}

fn main() {
    let start = Instant::now();
    let grid = sudoku::Grid::new([
        row![_ 7 _  _ _ 4  _ _ _],
        row![_ _ _  _ 5 _  1 _ _],
        row![8 _ _  _ _ _  6 _ _],
        row![_ _ _  6 _ _  2 _ _],
        row![_ _ 1  _ _ _  _ _ _],
        row![_ 5 _  _ _ _  _ _ _],
        row![2 _ _  1 _ _  _ 4 _],
        row![_ _ _  3 _ _  _ 5 _],
        row![6 _ _  _ 7 _  _ _ _],
    ]);
    let mut acc = Vec::new();
    sudoku::solve(&grid, &mut acc, Default::default());
    eprintln!("solved in {:.2?}", start.elapsed());
    eprintln!("found {} solutions", acc.len());
    if let Some(solution) = acc.first() {
        eprintln!("{:?}", solution);
    }
}
