const http = require("node:http");
const { WorkMemoryService } = require("./memory-service");
const { serveUiAsset } = require("./ui-assets");
const { handleUiApiRequest } = require("./ui-routes");

async function startReviewUiServer({
  host = "127.0.0.1",
  port = 37671,
  allowPublicBind = false,
  service,
} = {}) {
  const bindHost = host || "127.0.0.1";
  if (!isLocalHost(bindHost) && !allowPublicBind) {
    throw new Error("public bind requires allowPublicBind.");
  }
  const resolvedService = service || new WorkMemoryService();
  const urlHost = formatHostForUrl(bindHost);
  const server = http.createServer(async (request, response) => {
    if (await handleUiApiRequest(request, response, resolvedService)) {
      return;
    }
    const url = new URL(request.url, `http://${urlHost}`);
    if (request.method === "GET" && serveUiAsset(url.pathname, response)) {
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("not found\n");
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, bindHost, resolve);
  });

  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  return {
    url: `http://${urlHost}:${actualPort}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

function isLocalHost(host) {
  return ["127.0.0.1", "localhost", "::1"].includes(host);
}

function formatHostForUrl(host) {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

module.exports = {
  formatHostForUrl,
  startReviewUiServer,
};
