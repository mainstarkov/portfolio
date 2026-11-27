use std::{env, error::Error, process};

fn run(args: &[String]) -> Result<(), Box<dyn Error>> {
    use std::collections::HashSet;
    use std::io::{BufRead, BufReader, Write};
    let [path] = args else {
        return Err("usage: rs-line-dedupe FILE".into());
    };
    let reader = BufReader::new(std::fs::File::open(path)?);
    let mut output = std::io::BufWriter::new(std::io::stdout().lock());
    let mut seen = HashSet::new();
    for line in reader.lines() {
        let line = line?;
        if seen.insert(line.clone()) {
            writeln!(output, "{line}")?;
        }
    }
    output.flush()?;
    Ok(())
}

fn main() {
    let args: Vec<_> = env::args().skip(1).collect();
    if let Err(error) = run(&args) {
        eprintln!("{error}");
        process::exit(1);
    }
}
