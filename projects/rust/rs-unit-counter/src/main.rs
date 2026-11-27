use std::{env, error::Error, process};

fn run(args: &[String]) -> Result<(), Box<dyn Error>> {
    let [value] = args else {
        return Err("usage: rs-unit-counter BYTES".into());
    };
    let bytes = value.parse::<u64>()?;
    let units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];
    let power = (0..units.len())
        .rev()
        .find(|&index| bytes >= (1u64 << (10 * index)))
        .unwrap_or(0);
    if power == 0 {
        println!("{bytes} B");
    } else {
        let scale = 1u128 << (10 * power);
        let hundredths = (u128::from(bytes) * 100 + scale / 2) / scale;
        println!(
            "{}.{:02} {}",
            hundredths / 100,
            hundredths % 100,
            units[power]
        );
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
