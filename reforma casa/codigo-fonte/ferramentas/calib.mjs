// Pinhole camera calibration (LM) from 3D-2D correspondences. World: X right, Y up, Z back.
const pts = [
  [[0.65,4.40,0],[188,552]], [[4.35,4.40,0],[438.5,540]], [[4.35,4.40,1.30],[450.5,569]], [[7.50,4.40,1.30],[641,556]],
  [[1.90,2.27,0],[263,690]], [[3.10,1.22,0],[345,765]], [[4.45,2.35,1.30],[459,690]], [[5.35,2.35,1.30],[513,690]],
  [[5.86,2.42,1.30],[541,690]], [[1.29,2.64,0],[217.7,669.7]], [[5.52,2.75,1.30],[524.5,668]], [[7.17,2.75,1.30],[629.3,663.3]],
];
function rot(a,b,c){ // yaw a (about Y), pitch b (about X), roll c (about Z) -> 3x3
  const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cc=Math.cos(c),sc=Math.sin(c);
  const Ry=[[ca,0,-sa],[0,1,0],[sa,0,ca]], Rx=[[1,0,0],[0,cb,sb],[0,-sb,cb]], Rz=[[cc,sc,0],[-sc,cc,0],[0,0,1]];
  const mul=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,v,k)=>s+v*B[k][j],0)));
  return mul(Rz,mul(Rx,Ry));
}
function project(p,P){ const [f,cx,cy,cz,a,b,c]=p, R=rot(a,b,c);
  const d=[P[0]-cx, -(P[1]-cy), P[2]-cz]; const q=R.map(r=>r[0]*d[0]+r[1]*d[1]+r[2]*d[2]);
  return [480+f*q[0]/q[2], 640+f*q[1]/q[2]]; }
function resid(p){ return pts.flatMap(([P,uv])=>{ const r=project(p,P); return [r[0]-uv[0], r[1]-uv[1]]; }); }
function lm(p){ let lam=1e-3;
  for(let it=0;it<500;it++){ const r=resid(p), n=p.length, J=[];
    for(let j=0;j<n;j++){ const h=j===0?0.5:1e-5, q=p.slice(); q[j]+=h; const r2=resid(q); J.push(r2.map((v,i)=>(v-r[i])/h)); }
    const A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,k)=>J[i].reduce((s,v,m)=>s+v*J[k][m],0)));
    const g=Array.from({length:n},(_,i)=>J[i].reduce((s,v,m)=>s+v*r[m],0));
    for(let i=0;i<n;i++) A[i][i]*=1+lam;
    // solve A dx = -g
    const M=A.map((row,i)=>[...row,-g[i]]);
    for(let c=0;c<n;c++){ let pv=c; for(let r2=c+1;r2<n;r2++) if(Math.abs(M[r2][c])>Math.abs(M[pv][c])) pv=r2; [M[c],M[pv]]=[M[pv],M[c]];
      for(let r2=0;r2<n;r2++) if(r2!==c){ const f=M[r2][c]/M[c][c]; for(let k=c;k<=n;k++) M[r2][k]-=f*M[c][k]; } }
    const dx=M.map((row,i)=>row[n]/row[i]); const pn=p.map((v,i)=>v+dx[i]);
    const e0=r.reduce((s,v)=>s+v*v,0), e1=resid(pn).reduce((s,v)=>s+v*v,0);
    if(e1<e0){ p=pn; lam*=0.3; } else lam*=10;
  } return p; }
let best=null;
for (const f0 of [450,550,700,900]) for (const d of [-6,-8,-11,-14]) {
  const p=lm([f0,4.8,2.5,d,0,0,0]); const e=Math.sqrt(resid(p).reduce((s,v)=>s+v*v,0)/pts.length);
  if(!best||e<best.e) best={p,e}; }
const p=best.p; console.log("rms px", best.e.toFixed(2), "f", p[0].toFixed(0), "cam", p.slice(1,4).map(v=>v.toFixed(2)).join(","), "ang(deg)", p.slice(4).map(v=>(v*180/Math.PI).toFixed(2)).join(","));
for (const [P,uv] of pts){ const r=project(p,P); console.log(P.join(","), "obs", uv.join(","), "proj", r.map(v=>v.toFixed(1)).join(",")); }
// tall part: find HT so that the top edge corners land on the observed v
for (const [X,obs] of [[0,[260.5,538.5]],[3.20,[411.3,531]]]) {
  let lo=4,hi=8; for(let i=0;i<60;i++){ const m=(lo+hi)/2, v=project(p,[X,m,3.0])[1]; if(v>obs[1]) lo=m; else hi=m; }
  const ht=(lo+hi)/2, uv=project(p,[X,ht,3.0]); console.log("tall X",X,"HT",ht.toFixed(2),"proj u",uv[0].toFixed(1),"obs u",obs[0]);
}
console.log("qf top visible line at X=0.65..: ", project(p,[1.5,4.40,0]).map(v=>v.toFixed(1)).join(","));
