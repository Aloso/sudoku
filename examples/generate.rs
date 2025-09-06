use std::time::Instant;

use rand::SeedableRng as _;

fn main() {
    let mut durations = Vec::new();

    let iterations = 100_000;

    let _grids = (0..iterations)
        .map(|_| {
            let mut rng = rand::rngs::SmallRng::from_rng(&mut rand::rng());
            let start = Instant::now();
            let s = sudoku::generate(&mut rng);
            durations.push(start.elapsed().as_secs_f64() * 1000.0);
            // eprint!(".");
            s
        })
        .collect::<Vec<_>>();

    eprintln!();
    durations.sort_unstable_by(|a, b| a.total_cmp(b));

    println!(
        "generated {iterations} sudokus in {:.2} seconds",
        durations.iter().sum::<f64>() / 1000.0,
    );
    println!(
        "min: {:.2} us, median: {:.2} us, p90: {:.2} us, p99: {:.2} us, max: {:.2} us",
        durations[0] * 1000.0,
        durations[(iterations as usize) / 2] * 1000.0,
        durations[(iterations as usize) * 9 / 10] * 1000.0,
        durations[(iterations as usize) * 99 / 100] * 1000.0,
        durations[(iterations as usize) - 1] * 1000.0,
    );
}
