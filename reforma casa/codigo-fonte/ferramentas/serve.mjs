import http from "http"; import fs from "fs"; import path from "path";
const root = process.argv[2], port = +process.argv[3] || 5173, saveDir = process.argv[4];
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json" };
http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "POST" && url.pathname === "/save" && saveDir) { // recebe imagens renderizadas (data URL) e grava em saveDir
    const name = path.basename(url.searchParams.get("name") || "img.jpg"); let body = "";
    req.on("data", c => body += c); req.on("end", () => {
      const b64 = body.replace(/^data:image\/\w+;base64,/, ""); fs.writeFileSync(path.join(saveDir, name), Buffer.from(b64, "base64"));
      res.writeHead(200); res.end("ok " + name); });
    return;
  }
  let p = decodeURIComponent(url.pathname); if (p === "/") p = "/reforma/casa-3d-reforma.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" }); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log("serving", root, "on", port, "save ->", saveDir));
