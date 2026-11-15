const fs = require('fs');
(async () => {
  const rhino = await require('rhino3dm')();
  const [capasIn, capasOut, ...files] = process.argv.slice(2);
  const C = JSON.parse(fs.readFileSync(capasIn, 'utf8'));
  const { gw: GW, gh: GH, celdaM } = C.malla; const N = GW * GH; const isla = Buffer.from(C.isla, 'base64');
  let i0 = GW, i1 = 0, j0 = GH, j1 = 0; for (let k = 0; k < N; k++) if (isla[k]) { const i = k % GW, j = Math.floor(k / GW); i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
  const leer = (f) => rhino.File3dm.fromByteArray(new Uint8Array(fs.readFileSync(f)));
  const docs = Object.fromEntries(files.map((f) => [f.split(/[\\/]/).pop(), leer(f)]));
  const objetos = (doc) => { const o = doc.objects(); const r = []; for (let i = 0; i < o.count; i++) r.push(o.get(i)); return r; };
  const capaDe = (doc, o) => doc.layers().findIndex(o.attributes().layerIndex).name;
  // perímetro principal → escala modelo↔malla
  const econ = docs['Tierra_Bomba_01_Economia_y_Turismo.3dm'];
  const per = objetos(econ).map((o) => o.geometry()).filter((g) => g.constructor.name === 'NurbsCurve').sort((a, b) => { const A = a.getBoundingBox(); const B = b.getBoundingBox(); return (B.max[0] - B.min[0]) - (A.max[0] - A.min[0]); })[0];
  const pb = per.getBoundingBox();
  const sx = (pb.max[0] - pb.min[0]) / ((i1 - i0 + 1) * celdaM); const sy = (pb.max[1] - pb.min[1]) / ((j1 - j0 + 1) * celdaM);
  const aModelo = (i, j) => [pb.min[0] + (i - i0 + 0.5) * celdaM * sx, pb.min[1] + (j1 - j + 0.5) * celdaM * sy];
  const aCelda = (x, y) => [i0 + (x - pb.min[0]) / (celdaM * sx) - 0.5, j1 - (y - pb.min[1]) / (celdaM * sy) + 0.5];
  console.log('escala modelo/metros', sx.toFixed(3), sy.toFixed(3));
  // calce: perímetro rasterizado vs isla
  const dom = per.domain; const poly = []; for (let k = 0; k <= 3000; k++) poly.push(per.pointAt(dom[0] + (dom[1] - dom[0]) * k / 3000));
  const dentro = (x, y) => { let c = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const [xa, ya] = poly[a]; const [xb, yb] = poly[b]; if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) c = !c; } return c; };
  let inter = 0, uni = 0; for (let k = 0; k < N; k++) { const i = k % GW, j = Math.floor(k / GW); const [x, y] = aModelo(i, j); const a = !!isla[k]; const b = dentro(x, y); if (a && b) inter++; if (a || b) uni++; }
  console.log('calce del contorno (IoU)', (inter / uni).toFixed(3));
  // malla → ráster (interpolación por triángulos)
  const rasterMalla = (g) => {
    const v = g.vertices(); const f = g.faces(); const P = []; for (let k = 0; k < v.count; k++) P.push(v.get(k));
    const out = new Float32Array(N).fill(-1);
    const tri = (a, b, c) => { const pa = aCelda(P[a][0], P[a][1]); const pbb = aCelda(P[b][0], P[b][1]); const pc = aCelda(P[c][0], P[c][1]);
      const mnx = Math.max(0, Math.floor(Math.min(pa[0], pbb[0], pc[0]))); const mxx = Math.min(GW - 1, Math.ceil(Math.max(pa[0], pbb[0], pc[0])));
      const mny = Math.max(0, Math.floor(Math.min(pa[1], pbb[1], pc[1]))); const mxy = Math.min(GH - 1, Math.ceil(Math.max(pa[1], pbb[1], pc[1])));
      const den = (pbb[1] - pc[1]) * (pa[0] - pc[0]) + (pc[0] - pbb[0]) * (pa[1] - pc[1]); if (Math.abs(den) < 1e-9) return;
      for (let j = mny; j <= mxy; j++) for (let i = mnx; i <= mxx; i++) { const w1 = ((pbb[1] - pc[1]) * (i - pc[0]) + (pc[0] - pbb[0]) * (j - pc[1])) / den; const w2 = ((pc[1] - pa[1]) * (i - pc[0]) + (pa[0] - pc[0]) * (j - pc[1])) / den; const w3 = 1 - w1 - w2; if (w1 < -1e-6 || w2 < -1e-6 || w3 < -1e-6) continue; out[j * GW + i] = w1 * P[a][2] + w2 * P[b][2] + w3 * P[c][2]; } };
    for (let k = 0; k < f.count; k++) { const q = f.get(k); tri(q[0], q[1], q[2]); if (q[2] !== q[3]) tri(q[0], q[2], q[3]); }
    return out;
  };
  const malla = (doc, nombre) => objetos(doc).find((o) => o.attributes().name === nombre).geometry();
  const codificar = (r, max) => { const b = Buffer.alloc(N, 255); let cub = 0, isl = 0; for (let k = 0; k < N; k++) { if (!isla[k]) continue; isl++; const v = r[k] < 0 ? 0 : r[k]; if (r[k] >= 0) cub++; b[k] = Math.round(Math.min(1, v / max) * 254); } console.log('   cobertura de la isla', (100 * cub / isl).toFixed(1), '%'); return b.toString('base64'); };
  const nuevas = [];
  const e = rasterMalla(malla(econ, 'Malla_Economia_Turismo')); const eMax = Math.max(...e);
  console.log('economía máx', eMax.toFixed(0));
  nuevas.push({ id: 'economia', nombre: 'Economía y turismo', unidad: 'intensidad relativa', rango: [0, Math.round(eMax)], fuente: 'Modelo de Rhino de la tesis: Tierra_Bomba_01_Economia_y_Turismo.3dm (malla de picos)', metodo: `Altura de la malla de picos interpolada en celdas de 47 m y dividida por su máximo (${Math.round(eMax)})`, rampa: 'calor', v: codificar(e, eMax) });
  const integ = docs['Tierra_Bomba_04_Modelo_Integral_Completo.3dm'];
  const s = rasterMalla(malla(integ, 'Malla_Picos_Sintesis')); const sMax = Math.max(...s);
  console.log('síntesis máx', sMax.toFixed(0));
  nuevas.push({ id: 'sintesis', nombre: 'Síntesis de picos', unidad: 'intensidad relativa', rango: [0, Math.round(sMax)], fuente: 'Modelo de Rhino de la tesis: Tierra_Bomba_04_Modelo_Integral_Completo.3dm (malla de picos de síntesis; la misma de Pendientes y de Malla_Picos)', metodo: `Altura de la malla de picos interpolada en celdas de 47 m y dividida por su máximo (${Math.round(sMax)})`, rampa: 'magma', v: codificar(s, sMax) });
  // drenaje: cercanía a las líneas de escorrentía
  const dren = docs['Tierra_Bomba_03_Analisis_Pendientes_y_Drenaje.3dm'];
  const lineas = objetos(dren).filter((o) => capaDe(dren, o) === '02_LINEAS_DRENAJE_ESCORRENTIA').map((o) => o.geometry());
  const pts = []; lineas.forEach((g) => { const d = g.domain; for (let k = 0; k <= 400; k++) { const p = g.pointAt(d[0] + (d[1] - d[0]) * k / 400); pts.push(aCelda(p[0], p[1])); } });
  const R = 3; const dr = new Float32Array(N).fill(-1);
  for (let k = 0; k < N; k++) { if (!isla[k]) continue; const i = k % GW, j = Math.floor(k / GW); let best = 1e9; for (const [x, y] of pts) { const dd = (x - i) ** 2 + (y - j) ** 2; if (dd < best) best = dd; } dr[k] = Math.max(0, 1 - Math.sqrt(best) / R); }
  console.log('drenaje: líneas', lineas.length);
  nuevas.push({ id: 'drenaje', nombre: 'Drenaje y escorrentía', unidad: 'cercanía a la línea de drenaje', rango: [0, Math.round(R * celdaM)], fuente: 'Modelo de Rhino de la tesis: Tierra_Bomba_03_Analisis_Pendientes_y_Drenaje.3dm (22 líneas de drenaje y escorrentía)', metodo: `1 sobre la línea de drenaje, baja a 0 a ${Math.round(R * celdaM)} m`, rampa: 'agua', v: codificar(dr, 1) });
  // hitos del modelo integral (para referencia)
  const hitos = objetos(integ).filter((o) => o.geometry().constructor.name === 'TextDot').map((o) => { const g = o.geometry(); const [ci, cj] = aCelda(g.point[0], g.point[1]); return { texto: g.text.split('\n')[0], nota: (g.text.split('\n')[1] || '').replace(/[[\]]/g, ''), i: +ci.toFixed(1), j: +cj.toFixed(1) }; });
  C.capas = [...C.capas, ...nuevas]; C.hitosRhino = hitos;
  fs.writeFileSync(capasOut, JSON.stringify(C));
  console.log('capas', C.capas.length, 'hitos', JSON.stringify(hitos));
})();
