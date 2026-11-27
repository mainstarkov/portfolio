import { createConnection } from "node:net";

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("Usage: node main.mjs PORT");
    process.exit(1);
}
const socket = createConnection({ port, host: "127.0.0.1", timeout: 1000 });
socket.once("connect", () => {
    console.log(`127.0.0.1:${port} is listening`);
    socket.destroy();
});
socket.once("timeout", () => socket.destroy(new Error("connection timed out")));
socket.once("error", (error) => {
    console.log(`127.0.0.1:${port} is unavailable (${error.code ?? error.message})`);
    process.exitCode = 1;
});
