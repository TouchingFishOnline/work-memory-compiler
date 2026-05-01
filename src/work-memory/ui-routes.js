async function handleUiApiRequest(request, response, service) {
  const url = new URL(request.url, "http://127.0.0.1");
  if (!url.pathname.startsWith("/api/")) {
    return false;
  }

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, { ok: true, name: "work-memory-compiler" });
    }
    if (request.method === "GET" && url.pathname === "/api/review-queue") {
      return sendJson(response, service.reviewQueue());
    }
    if (request.method === "POST" && url.pathname === "/api/review-operations") {
      const body = await readJsonBody(request);
      return sendJson(response, service.applyBatchReviewOperations({ operations: body.operations }));
    }
    if (request.method === "GET" && url.pathname === "/api/decisions") {
      return sendJson(response, { items: service.store.listDecisions() });
    }
    if (request.method === "PATCH" && url.pathname.startsWith("/api/decisions/")) {
      const decisionId = decodeURIComponent(url.pathname.slice("/api/decisions/".length));
      const body = await readJsonBody(request);
      return sendJson(response, service.updateDecision({ decisionId, patch: body.patch || body }));
    }
    if (request.method === "GET" && url.pathname === "/api/memory") {
      return sendJson(response, { items: service.store.listMemoryItems() });
    }
    if (request.method === "POST" && url.pathname === "/api/memory") {
      const body = await readJsonBody(request);
      return sendJson(response, service.reviewMemory({ operation: body }));
    }
    if (request.method === "GET" && url.pathname === "/api/dashboard") {
      return sendJson(response, service.dashboard());
    }
    if (request.method === "GET" && url.pathname === "/api/custom-schema") {
      return sendJson(response, service.getCustomEventSchema());
    }
    if (request.method === "POST" && url.pathname === "/api/custom-schema") {
      const body = await readJsonBody(request);
      return sendJson(response, service.setCustomEventSchema(body));
    }
    return sendJson(response, { error: "not_found" }, 404);
  } catch (error) {
    return sendJson(response, {
      error: error instanceof Error ? error.message : String(error),
    }, 400);
  }
}

function sendJson(response, data, statusCode = 200) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(data, null, 2)}\n`);
  return true;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("request body too large"));
      }
    });
    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

module.exports = {
  handleUiApiRequest,
};
