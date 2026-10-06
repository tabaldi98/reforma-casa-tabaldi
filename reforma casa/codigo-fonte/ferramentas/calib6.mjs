import fs from "fs";
const src = fs.readFileSync("calib.mjs","utf8");
// reuse projection + LM from calib.mjs by eval of function bodies
const fnSrc = src.slice(src.indexOf("function rot"), src.indexOf("let best=null"));
const pts = [
  [[7.50,4.40,1.30],[260,572]], [[7.50,4.40,10.91],[468.7,397.3]], [[4.35,4.40,10.91],[636.3,461.3]], [[4.35,4.40,12.56],[743.3,411.7]],
  [[7.50,0.20,10.91],[475,781]], [[4.35,0.20,10.91],[641,750]], [[7.50,2.42,7.20],[350,608]], [[7.50,2.42,8.40],[381.7,606]],
  [[5.25,2.32,10.91],[599.7,593]], [[6.85,2.42,10.91],[519.3,580]],
];
const run = new Function("pts", fnSrc + `
  let best=null;
  for (const f0 of [450,600,800]) for (const yaw of [Math.PI, Math.PI*0.85, Math.PI*1.15]) for (const cz of [16,19,23]) for (const cx of [8,10,12]) {
    const p=lm([f0,cx,1.5,cz,yaw,0.1,0]); const e=Math.sqrt(resid(p).reduce((s,v)=>s+v*v,0)/pts.length);
    if(isFinite(e)&&(!best||e<best.e)) best={p,e}; }
  return {best, project};`);
const { best, project } = run(pts); const p = best.p;
console.log("rms", best.e.toFixed(2), "f", p[0].toFixed(0), "cam", p.slice(1,4).map(v=>v.toFixed(2)).join(","), "ang", p.slice(4).map(v=>(v*180/Math.PI).toFixed(1)).join(","));
for (const [P,uv] of pts) console.log(P.join(","), uv.join(","), "->", project(p,P).map(v=>v.toFixed(1)).join(","));
// back-project an image point onto horizontal plane y=h: search along ray numerically
function onPlane(u,v,h){ // solve for X,Z with project(p,[X,h,Z]) = (u,v) by Newton
  let X=9, Z=8; for(let i=0;i<200;i++){ const r=project(p,[X,h,Z]); const e=[r[0]-u,r[1]-v];
    const dX=project(p,[X+1e-4,h,Z]), dZ=project(p,[X,h,Z+1e-4]);
    const J=[[(dX[0]-r[0])/1e-4,(dZ[0]-r[0])/1e-4],[(dX[1]-r[1])/1e-4,(dZ[1]-r[1])/1e-4]];
    const det=J[0][0]*J[1][1]-J[0][1]*J[1][0]; X-= ( J[1][1]*e[0]-J[0][1]*e[1])/det*0.5; Z-= (-J[1][0]*e[0]+J[0][0]*e[1])/det*0.5; }
  return [X,Z]; }
for (const [lbl,u,v,h] of [["wall base (left edge)",16,816,0],["wall base",30,810,0],["carport left post base",50,796,0],["car front plate",170,748,0.40],["car left wheel",110,772,0.30],["car right wheel",225,770,0.30]])
  console.log(lbl, onPlane(u,v,h).map(x=>x.toFixed(2)).join(","));
