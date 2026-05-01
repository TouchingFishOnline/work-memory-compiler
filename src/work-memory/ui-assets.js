const fs = require("node:fs");
const path = require("node:path");

const ASSET_ROOT = path.resolve(__dirname, "..", "..", "public", "review-ui");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function serveUiAsset(requestPath, response) {
  const assetPath = resolveAssetPath(requestPath);
  if (!assetPath) {
    return false;
  }
  if (!fs.existsSync(assetPath)) {
    return false;
  }
  response.writeHead(200, {
    "content-type": CONTENT_TYPES[path.extname(assetPath)] || "application/octet-stream",
  });
  response.end(fs.readFileSync(assetPath));
  return true;
}

function resolveAssetPath(requestPath) {
  const pathname = requestPath === "/" ? "/index.html" : requestPath;
  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const assetPath = path.join(ASSET_ROOT, normalized);
  if (!assetPath.startsWith(ASSET_ROOT)) {
    return null;
  }
  return assetPath;
}

module.exports = {
  serveUiAsset,
};
