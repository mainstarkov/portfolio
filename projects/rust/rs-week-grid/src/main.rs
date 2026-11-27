use std::{env, error::Error, process};

fn run(args: &[String]) -> Result<(), Box<dyn Error>> {
    if args.is_empty()
        || args
            .iter()
            .any(|item| item.trim().is_empty() || item.contains(['|', '\n', '\r', '\\']))
    {
        return Err("usage: rs-week-grid HABIT... (no pipes, backslashes or newlines)".into());
    }
    println!("| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun |");
    println!("| --- | --- | --- | --- | --- | --- | --- | --- |");
    for habit in args {
        let escaped = habit
            .replace('&', "&amp;")
            .replace('<', "&lt;")
            .replace('>', "&gt;");
        println!("| {escaped} |   |   |   |   |   |   |   |");
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
