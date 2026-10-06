import fs from "fs"; import jpeg from "jpeg-js";
const IM = process.argv[2], OUT = process.argv[3];
const spec = JSON.parse(fs.readFileSync("faces.json","utf8"));
fs.mkdirSync(OUT, { recursive: true });
// solve homography mapping (u,v)->(x,y) from 4 correspondences
function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) { const [u,v] = src[i], [x,y] = dst[i];
    A.push([u,v,1,0,0,0,-u*x,-v*x]); b.push(x);
    A.push([0,0,0,u,v,1,-u*y,-v*y]); b.push(y); }
  const n = 8; // gaussian elimination
  for (let c = 0; c < n; c++) { let p = c; for (let r = c+1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c],A[p]] = [A[p],A[c]]; [b[c],b[p]] = [b[p],b[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]/A[c][c]; for (let k = c; k < n; k++) A[r][k] -= f*A[c][k]; b[r] -= f*b[c]; } }
  const h = b.map((v,i)=>v/A[i][i]); h.push(1); return h;
}
const cache = {};
const photo = n => cache[n] ||= jpeg.decode(fs.readFileSync(`${IM}/${n}.jpg`), { useTArray: true });
for (const [name, f] of Object.entries(spec.faces)) {
  const img = photo(f.photo), W = Math.round(f.w*spec.res), H = Math.round(f.h*spec.res);
  const h = homography([[0,0],[W,0],[W,H],[0,H]], f.pts);
  const out = Buffer.alloc(W*H*4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x+0.5, v = y+0.5, d = h[6]*u+h[7]*v+1;
    let sx = (h[0]*u+h[1]*v+h[2])/d - 0.5, sy = (h[3]*u+h[4]*v+h[5])/d - 0.5;
    sx = Math.max(0, Math.min(img.width-1.001, sx)); sy = Math.max(0, Math.min(img.height-1.001, sy));
    const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx-x0, fy = sy-y0, o = (y*W+x)*4;
    for (let c = 0; c < 3; c++) { const p = (yy,xx)=>img.data[(yy*img.width+xx)*4+c];
      out[o+c] = (p(y0,x0)*(1-fx)+p(y0,x0+1)*fx)*(1-fy) + (p(y0+1,x0)*(1-fx)+p(y0+1,x0+1)*fx)*fy; }
    out[o+3] = 255;
  }
  fs.writeFileSync(`${OUT}/${name}.jpg`, jpeg.encode({ data: out, width: W, height: H }, 85).data);
  console.log(name, W, H);
}
