use std::{env, error::Error, process};

fn run(args: &[String]) -> Result<(), Box<dyn Error>> {
    let [rounds, focus, rest] = args else {
        return Err("usage: rs-pomodoro-plan ROUNDS FOCUS_MIN REST_MIN".into());
    };
    let (rounds, focus, rest) = (
        rounds.parse::<u32>()?,
        focus.parse::<u64>()?,
        rest.parse::<u64>()?,
    );
    if !(1..=100).contains(&rounds) || !(1..=1440).contains(&focus) || rest > 1440 {
        return Err("expected 1–100 rounds, 1–1440 focus minutes and 0–1440 rest minutes".into());
    }
    let mut start = 0;
    for round in 1..=rounds {
        let end = start + focus;
        println!("Focus {round}: {start}–{end} min");
        if round < rounds && rest > 0 {
            println!("Break: {end}–{} min", end + rest);
        }
        start = end + rest;
    }
    Ok(())
}

fn main() {
    let args: Vec<_> = env::args().skip(1).collect();
    if let Err(error) = run(&args) {
        eprintln!("{error}");
        process::exit(1);
    }
}
