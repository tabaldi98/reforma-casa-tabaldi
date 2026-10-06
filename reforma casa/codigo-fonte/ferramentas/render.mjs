import { pdf } from "pdf-to-img";
import fs from "fs";
const doc = await pdf("planta.pdf", { scale: 3 });
console.log("pages", doc.length);
let i = 1;
for await (const img of doc) { fs.writeFileSync(`planta_p${i}.png`, img); i++; }
