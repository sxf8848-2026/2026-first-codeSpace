import { spawn } from "node:child_process";

const processes = [
  spawn("npm", ["run", "api"], { stdio: "inherit", shell: true }),
  spawn("npm", ["run", "dev:web"], { stdio: "inherit", shell: true }),
];

function stopAll(signal) {
  for (const child of processes) {
    if (!child.killed) child.kill(signal);
  }
}

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stopAll("SIGTERM");
      process.exit(code);
    }
  });
}

process.on("SIGINT", () => {
  stopAll("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll("SIGTERM");
  process.exit(0);
});
