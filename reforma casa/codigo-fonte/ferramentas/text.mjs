import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
const data = new Uint8Array(fs.readFileSync("planta.pdf"));
const doc = await pdfjs.getDocument({ data }).promise;
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const vp = page.getViewport({ scale: 1 });
  console.log("page", p, "size", vp.width, vp.height);
  const tc = await page.getTextContent();
  for (const it of tc.items) if (it.str.trim()) console.log(JSON.stringify(it.str), it.transform.map(n=>Math.round(n*10)/10).join(","));
}
