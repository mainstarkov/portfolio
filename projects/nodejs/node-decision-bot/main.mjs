import { randomInt } from "node:crypto";

const options = [...new Set(process.argv.slice(2).map((value) => value.trim()).filter(Boolean))];
if (options.length < 2) {
    console.error("Usage: node main.mjs OPTION OPTION...");
    process.exitCode = 1;
} else {
    console.log(`Выбираю: ${options[randomInt(options.length)]}`);
}
