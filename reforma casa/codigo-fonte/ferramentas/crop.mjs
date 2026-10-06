// usage: node crop.mjs in.jpg out.png x0 y0 x1 y1 scale [grid]
import fs from "fs"; import jpeg from "jpeg-js"; import { PNG } from "pngjs";
const [inp, out, x0, y0, x1, y1, sc, grid] = process.argv.slice(2);
const img = jpeg.decode(fs.readFileSync(inp), { useTArray: true });
const X0=+x0,Y0=+y0,X1=+x1,Y1=+y1,S=+sc;
const W=Math.round((X1-X0)*S), H=Math.round((Y1-Y0)*S);
const png = new PNG({ width: W, height: H });
for (let y=0;y<H;y++) for (let x=0;x<W;x++){
  const sx=Math.min(img.width-1,Math.floor(X0+x/S)), sy=Math.min(img.height-1,Math.floor(Y0+y/S));
  const si=(sy*img.width+sx)*4, di=(y*W+x)*4;
  let r=img.data[si],g=img.data[si+1],b=img.data[si+2];
  if (grid) { const g2=+grid; const px=X0+x/S, py=Y0+y/S;
    if (Math.abs(px/g2-Math.round(px/g2))*g2 < 0.5/S*1.5 || Math.abs(py/g2-Math.round(py/g2))*g2 < 0.5/S*1.5) { r=255; g=0; b=0; } }
  png.data[di]=r;png.data[di+1]=g;png.data[di+2]=b;png.data[di+3]=255;
}
fs.writeFileSync(out, PNG.sync.write(png));
console.log(out, W, H, "src", img.width, img.height);
