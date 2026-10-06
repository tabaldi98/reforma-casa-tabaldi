// usage: node montage.mjs in.jpg out.png size scale "x,y;x,y;..."  (x,y = tile origin)
import fs from "fs"; import jpeg from "jpeg-js"; import { PNG } from "pngjs";
const [inp, out, sz, sc, list] = process.argv.slice(2);
const img = jpeg.decode(fs.readFileSync(inp), { useTArray: true });
const S=+sc, T=+sz, tiles=list.split(";").map(p=>p.split(",").map(Number));
const cols=3, rows=Math.ceil(tiles.length/cols), TW=T*S, gap=6;
const W=cols*TW+(cols-1)*gap, H=rows*TW+(rows-1)*gap;
const png=new PNG({width:W,height:H}); png.data.fill(40);
tiles.forEach(([ox,oy],i)=>{ const cx=(i%cols)*(TW+gap), cy=Math.floor(i/cols)*(TW+gap);
  for(let y=0;y<TW;y++)for(let x=0;x<TW;x++){ const fx=ox+x/S, fy=oy+y/S;
    const sx=Math.min(img.width-1,Math.max(0,Math.floor(fx))), sy=Math.min(img.height-1,Math.max(0,Math.floor(fy)));
    const si=(sy*img.width+sx)*4; let r=img.data[si],g=img.data[si+1],b=img.data[si+2];
    const onX=(x%(10*S))===0, onY=(y%(10*S))===0, big=(((ox+x/S)%50)===0&&onX)||(((oy+y/S)%50)===0&&onY);
    if(big){r=255;g=0;b=0;} else if(onX||onY){r=(r+0)/2|0;g=(g+200)/2|0;b=(b+255)/2|0;}
    const di=((cy+y)*W+cx+x)*4; png.data[di]=r;png.data[di+1]=g;png.data[di+2]=b;png.data[di+3]=255; }});
fs.writeFileSync(out, PNG.sync.write(png)); console.log(out,W,H);
