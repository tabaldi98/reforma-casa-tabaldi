// Build: patch textures, make generic plaster tile, inline everything into one HTML
import fs from "fs"; import jpeg from "jpeg-js";
const [src, outFile] = process.argv.slice(2);
const texDir = `${src}/tex`, res = 110;
const dec = f => jpeg.decode(fs.readFileSync(f), { useTArray: true });
const enc = (img, q = 82) => Buffer.from(jpeg.encode(img, q).data);
const tex = {};
for (const f of fs.readdirSync(texDir).filter(f => f.endsWith(".jpg"))) tex[f.slice(0, -4)] = dec(`${texDir}/${f}`);
// 1) lateral direita: a garagem tapa os primeiros ~2,7 m -> copia (espelhado) o reboco limpo logo atras
{ const im = tex.right, W = im.width, cut = Math.round(2.7 * res), span = Math.round(2.2 * res);
  for (let y = 0; y < im.height; y++) for (let x = 0; x < cut; x++) {
    const k = (cut - 1 - x) % (2 * span), sx = cut + (k < span ? k : 2 * span - 1 - k);
    for (let c = 0; c < 4; c++) im.data[(y * W + x) * 4 + c] = im.data[(y * W + sx) * 4 + c]; } }
// 2) reboco generico (recorte da lateral do quarto da frente, sem frisos)
{ const im = tex.qfLeft, x0 = Math.round(0.3 * res), x1 = Math.round(2.7 * res), y0 = Math.round((4.40 - 2.75) * res), y1 = Math.round((4.40 - 0.35) * res);
  const w = x1 - x0, h = y1 - y0, d = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) d.set(im.data.subarray(((y0 + y) * im.width + x0) * 4, ((y0 + y) * im.width + x1) * 4), y * w * 4);
  tex.plaster = { width: w, height: h, data: d }; }
const map = {}; let total = 0;
for (const [k, im] of Object.entries(tex)) { const b = enc(im); total += b.length; map[k] = "data:image/jpeg;base64," + b.toString("base64"); }
fs.writeFileSync(`${src}/tex-right-patched.jpg`, enc(tex.right, 90));
const html = fs.readFileSync(`${src}/template.html`, "utf8").replace("<!--TEX-->", `<script>window.TEX=${JSON.stringify(map)};</script>`);
fs.writeFileSync(outFile, html);
console.log("textures", Object.keys(map).length, "jpeg bytes", total, "html bytes", html.length);
