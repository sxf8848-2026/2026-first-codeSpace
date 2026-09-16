import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isValidPrefsPayload, isValidTodosPayload } from "./schema.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(rootDir, "todo-data");
const todosFile = join(dataDir, "todos.json");
const prefsFile = join(dataDir, "prefs.json");
const port = Number(process.env.TODO_API_PORT || 5174);

const defaultTodos = {
  version: 17,
  todos: {},
  weeklyTodos: {},
  awesomeRecords: {},
  monthlyTodos: {},
  weeklyDeliveries: {},
  habits: [],
  habitChecks: {},
  inspirations: [],
  metaLearningAbilities: [],
  videoInspirations: [],
  workExperiences: [],
  default_applied: [],
};

const defaultPrefs = {
  theme: "light",
};

const writeQueues = new Map();

await mkdir(dataDir, { recursive: true });

const server = createServer(async (request, response) => {
  try {
    if (!request.url) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/todos") {
      const resource = await readJsonResource(todosFile, defaultTodos);
      sendJson(response, 200, resource.data, { ETag: resource.etag });
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/todos") {
      const payload = await parseJsonBody(request);
      if (!isValidTodosPayload(payload)) {
        sendJson(response, 400, { error: "Invalid todos payload" });
        return;
      }
      const resource = await writeJsonWithVersionLock(todosFile, payload, request.headers["if-match"]);
      sendJson(response, 200, { ok: true }, { ETag: resource.etag });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/prefs") {
      const resource = await readJsonResource(prefsFile, defaultPrefs);
      sendJson(response, 200, resource.data, { ETag: resource.etag });
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/prefs") {
      const payload = await parseJsonBody(request);
      if (!isValidPrefsPayload(payload)) {
        sendJson(response, 400, { error: "Invalid prefs payload" });
        return;
      }
      const resource = await writeJsonWithVersionLock(prefsFile, payload, request.headers["if-match"]);
      sendJson(response, 200, { ok: true }, { ETag: resource.etag });
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    if (error instanceof RequestError) {
      sendJson(response, error.statusCode, { error: error.message });
      return;
    }

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Todo API ready at http://127.0.0.1:${port}`);
  console.log(`Data directory: ${dataDir}`);
});

async function readJson(file, fallback) {
  return (await readJsonResource(file, fallback)).data;
}

async function readJsonResource(file, fallback) {
  try {
    const raw = await readFile(file, "utf-8");
    return {
      data: JSON.parse(raw),
      etag: createEtag(raw),
    };
  } catch {
    const raw = JSON.stringify(fallback);
    return {
      data: fallback,
      etag: createEtag(raw),
    };
  }
}

async function writeJson(file, data) {
  const tempFile = `${file}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  await rename(tempFile, file);
}

async function writeJsonWithVersionLock(file, data, ifMatch) {
  return enqueueFileWrite(file, async () => {
    const current = await readJsonResource(file, file === prefsFile ? defaultPrefs : defaultTodos);
    if (ifMatch && ifMatch !== current.etag) {
      throw new RequestError(412, "Project file changed, please reload before saving");
    }

    await writeJson(file, data);
    return readJsonResource(file, file === prefsFile ? defaultPrefs : defaultTodos);
  });
}

function enqueueFileWrite(file, task) {
  const previous = writeQueues.get(file) ?? Promise.resolve();
  const next = previous.then(task, task);
  const settled = next
    .catch(() => undefined)
    .finally(() => {
      if (writeQueues.get(file) === settled) {
        writeQueues.delete(file);
      }
    });
  writeQueues.set(file, settled);
  return next;
}

function createEtag(raw) {
  return `"${createHash("sha256").update(raw).digest("hex")}"`;
}

async function parseJsonBody(request) {
  const body = await readBody(request);
  try {
    return JSON.parse(body);
  } catch {
    throw new RequestError(400, "Invalid JSON body");
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let rejected = false;
    request.setEncoding("utf-8");
    request.on("data", (chunk) => {
      if (rejected) return;
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        rejected = true;
        reject(new RequestError(413, "Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!rejected) resolve(body);
    });
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, data, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(JSON.stringify(data));
}

class RequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
