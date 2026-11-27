const value = process.argv[2];
if (value === undefined) {
    console.error("Usage: node main.mjs QUERY_STRING");
    process.exit(1);
}
const groups = new Map();
for (const [key, item] of new URLSearchParams(value)) {
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
}
console.log(JSON.stringify(Object.fromEntries(
    [...groups].map(([key, values]) => [key, values.length === 1 ? values[0] : values])
), null, 2));
