use std::{env, error::Error, process};

fn run(args: &[String]) -> Result<(), Box<dyn Error>> {
    fn luminance(value: &str) -> Result<f64, Box<dyn Error>> {
        let value = value.strip_prefix('#').unwrap_or(value);
        if value.len() != 6 || !value.bytes().all(|byte| byte.is_ascii_hexdigit()) {
            return Err("expected a six-digit hex color".into());
        }
        let mut result = 0.0;
        for (index, weight) in [0.2126, 0.7152, 0.0722].into_iter().enumerate() {
            let channel =
                f64::from(u8::from_str_radix(&value[index * 2..index * 2 + 2], 16)?) / 255.0;
            let linear = if channel <= 0.04045 {
                channel / 12.92
            } else {
                ((channel + 0.055) / 1.055).powf(2.4)
            };
            result += weight * linear;
        }
        Ok(result)
    }
    let [first, second] = args else {
        return Err("usage: rs-palette-contrast HEX HEX".into());
    };
    let (first, second) = (luminance(first)?, luminance(second)?);
    println!(
        "{:.2}:1",
        (first.max(second) + 0.05) / (first.min(second) + 0.05)
    );
    Ok(())
}

fn main() {
    let args: Vec<_> = env::args().skip(1).collect();
    if let Err(error) = run(&args) {
        eprintln!("{error}");
        process::exit(1);
    }
}
