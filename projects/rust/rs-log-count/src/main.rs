use std::{env, error::Error, process};

fn run(args: &[String]) -> Result<(), Box<dyn Error>> {
    use std::io::{BufRead, BufReader};
    let [path] = args else {
        return Err("usage: rs-log-count FILE".into());
    };
    let reader = BufReader::new(std::fs::File::open(path)?);
    let mut totals = [0u64; 4];
    for line in reader.lines() {
        let line = line?;
        let level = match line.split_whitespace().next() {
            Some("INFO") => 0,
            Some("WARN") => 1,
            Some("ERROR") => 2,
            Some(_) => 3,
            None => continue,
        };
        totals[level] += 1;
    }
    for (label, count) in ["INFO", "WARN", "ERROR", "OTHER"].into_iter().zip(totals) {
        println!("{label}: {count}");
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
