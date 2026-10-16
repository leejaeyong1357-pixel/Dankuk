/**
 * 세계지도 SVG 경로 생성 — lib/global/world-paths.ts 를 만든다.
 *
 * 손으로 그린 윤곽은 아무리 다듬어도 대륙 비율이 맞지 않는다.
 * Natural Earth(퍼블릭 도메인)를 담은 world-atlas TopoJSON 을 읽어
 * 등장방형으로 투영한다.
 *
 * 내보내는 것은 두 개다.
 *   LAND   국경선 없이 하나로 합친 육지 실루엣 (시안이 그렇게 생겼다)
 *   KOREA  대한민국만 따로 — 진한 색으로 칠해 출발점을 표시한다
 *
 * 나라마다 path 를 나눠 흰 테두리로 국경선을 그려 봤지만, 1000px 폭에서는
 * 선이 너무 촘촘해 지도가 지저분해졌다. 시안에는 국경선이 없다.
 *
 * 입력 파일(2.4MB)은 저장소에 넣지 않는다. 결과만 커밋한다.
 * 다시 만들 일이 생기면 받아서 경로를 넘긴다.
 *
 *   npm pack world-atlas@2.0.2 && tar xzf world-atlas-2.0.2.tgz
 *   npm run map -- package/countries-50m.json
 *
 * 솎아내는 정도는 환경변수로 조절한다 (기본값이 지금 커밋된 결과를 만든다).
 *   TOL=0.5       굴곡을 얼마나 펼지 (지도 좌표 단위, 1000px 폭 기준)
 *   MIN_AREA=1.5  이보다 작은 섬은 버린다
 */
import fs from "node:fs";

const src = process.argv[2];
const out = process.argv[3] ?? "lib/global/world-paths.ts";
const topo = JSON.parse(fs.readFileSync(src, "utf8"));

const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;

/** 델타 압축을 풀고 경위도로 되돌린다 */
function decodeArc(arc) {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * sx + tx, y * sy + ty];
  });
}
const arcs = topo.arcs.map(decodeArc);

/** 등장방형 투영 — 0~1000 x 0~500 */
const PX = (lon) => ((lon + 180) / 360) * 1000;
const PY = (lat) => ((90 - lat) / 180) * 500;

function ring(indexes) {
  const pts = [];
  for (const i of indexes) {
    const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
    // 이어 붙이는 지점이 겹치므로 둘째 호부터는 첫 점을 버린다
    for (const p of pts.length ? a.slice(1) : a) pts.push(p);
  }
  return pts.map(([lon, lat]) => [PX(lon), PY(lat)]);
}

/** 신발끈 공식 — 너무 작은 섬을 걸러내는 데 쓴다 */
function area(pts) {
  let s = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    s += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  }
  return Math.abs(s) / 2;
}

/**
 * 점 솎아내기 (Douglas-Peucker).
 *
 * 1000px 폭으로 그리므로 0.35px 보다 촘촘한 굴곡은 보이지 않는다.
 * 그대로 두면 파일만 커진다.
 *
 * 여는 선분에만 쓴다 — 닫힌 고리는 아래 simplifyRing 을 거쳐야 한다.
 */
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let far = -1, best = tol;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
      if (d > best) { best = d; far = i; }
    }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/**
 * 닫힌 고리 솎아내기.
 *
 * 고리는 첫 점과 끝 점이 같아 Douglas-Peucker 의 기준선 길이가 0 이 된다.
 * 그러면 모든 점의 거리가 0 으로 나와 고리가 통째로 사라진다.
 * 먼저 첫 점에서 가장 먼 점을 찾아 고리를 두 토막으로 가른 뒤 각각 돌린다.
 */
function simplifyRing(pts, tol) {
  if (pts.length < 6) return pts;
  const [ax, ay] = pts[0];
  let far = 0, best = -1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = (pts[i][0] - ax) ** 2 + (pts[i][1] - ay) ** 2;
    if (d > best) { best = d; far = i; }
  }
  const head = simplify(pts.slice(0, far + 1), tol);
  const tail = simplify(pts.slice(far), tol);
  return [...head, ...tail.slice(1)];
}

const MIN_AREA = Number(process.env.MIN_AREA ?? 0.12);
const TOL = Number(process.env.TOL ?? 0.35);
const r = (n) => Math.round(n * 10) / 10;

function pathOf(geom, skip) {
  const polys = geom.type === "Polygon" ? [geom.arcs] : geom.arcs;
  let d = "";
  for (const poly of polys) {
    for (const idx of poly) {
      let pts = ring(idx);
      if (area(pts) < MIN_AREA) continue;
      if (skip && skip(pts)) continue;
      pts = simplifyRing(pts, TOL);
      if (pts.length < 3) continue;
      d += `M${r(pts[0][0])} ${r(pts[0][1])}`;
      let [px, py] = [r(pts[0][0]), r(pts[0][1])];
      for (const p of pts.slice(1)) {
        const [x, y] = [r(p[0]), r(p[1])];
        if (x === px && y === py) continue;
        d += `L${x} ${y}`;
        px = x; py = y;
      }
      d += "Z";
    }
  }
  return d;
}

/**
 * 남극은 등장방형에서 아래를 가로로 꽉 채워 지도를 눌러 버린다.
 * 합친 육지에는 id 가 없으므로 "전부 남위 50도 아래" 인 덩어리를 버린다.
 */
const ANTARCTIC_Y = PY(-50);

const land = pathOf(topo.objects.land.geometries[0], (pts) =>
  pts.every(([, y]) => y > ANTARCTIC_Y),
);
const korea = pathOf(
  topo.objects.countries.geometries.find((g) => g.id === "410"),
);
if (!land || !korea) {
  console.error("육지 또는 대한민국 경로를 만들지 못했습니다.");
  process.exit(1);
}

fs.writeFileSync(
  out,
  `/**
 * 세계지도 경로 — 자동 생성물이다. 손으로 고치지 말 것.
 *
 * Natural Earth(퍼블릭 도메인)를 담은 world-atlas 를 등장방형으로 투영했다.
 * 좌표계는 0~1000 x 0~500, 경도 -180~180 / 위도 90~-90 이 그대로 대응한다.
 *   x = (경도 + 180) / 360 * 1000
 *   y = (90 - 위도) / 180 * 500
 *
 * LAND 는 국경선 없이 하나로 합친 육지다. 남극은 뺐다.
 * KOREA 는 대한민국만 따로 — 출발점을 진한 색으로 칠하는 데 쓴다.
 *
 * 다시 만들려면: npm run map -- <countries-50m.json 경로>
 */

/** 국경선 없는 육지 실루엣 */
export const LAND = "${land}";

/** 대한민국 */
export const KOREA = "${korea}";

/** 경위도를 지도 좌표로 */
export function px(lon: number): number {
  return ((lon + 180) / 360) * 1000;
}
export function py(lat: number): number {
  return ((90 - lat) / 180) * 500;
}
`,
);

console.log(
  `육지 ${(land.length / 1024).toFixed(0)}KB / 대한민국 ${korea.length}자 / 전체 ${(fs.statSync(out).size / 1024).toFixed(0)}KB`,
);
