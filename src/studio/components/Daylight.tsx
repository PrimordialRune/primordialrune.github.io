// A remembered Sunday afternoon (architecture §9.1): the room sits in a cool shade and a
// window's worth of sun falls across it, diagonally, crossing the info card, the TV bezel,
// the plank and the objects. Light only (P4): every layer is transparent light or shadow,
// no surface changes its own fill. The panes drift over a minute, in FULL and SOFT alike:
// a room at rest is still a room with a sun in it.
//
// Stacked SVGs share one geometry (drawn in room pixels at a reference size and scaled
// uniformly, so the panes keep their shape at any window size):
//   shade  peacock at a few percent, with the panes cut out of it
//   warm   gold, multiplied: cream turns to afternoon, dark ink stays dark
//   sun    cream, screened: dark surfaces (bezel, plank, the cartridges) catch the sun
//   bloom  the same panes, soft and multiplied: warm spill around the sun
// No backdrop filters and no CSS filters: every layer is a flat SVG that only moves by
// transform, one step a second, so the room at rest costs nothing between steps. The CTA
// sits above the light (a button keeps its flat fill, P4).

interface WindowShape {
  /** the window's top-left corner, in room px at the reference size */
  at: [number, number];
  /** local -> room: the across and down vectors (the sun's slant) */
  across: [number, number];
  down: [number, number];
  cols: number;
  rows: number;
  /** pane size and mullion thickness, local px */
  pane: [number, number];
  bar: number;
}

interface Scene {
  /** the daylight box at the reference size (the room plus its overscan), px */
  view: [number, number];
  /** where the room's top-left sits inside that box */
  offset: [number, number];
  /** how the box scales: desk fills by height, phone by width */
  fit: string;
  windows: WindowShape[];
}

// Desk reference: 1440 x 844 room. The sun comes from a window up and to the right and
// falls down-left: across the contacts, over the TV's lower-right bezel, onto the plank.
const DESK: Scene = {
  view: [1728, 1047],
  offset: [144, 101],
  fit: "xMidYMid slice",
  windows: [{ at: [1012, -6], across: [1, -0.08], down: [-0.52, 1], cols: 2, rows: 3, pane: [158, 246], bar: 16 }],
};

// Phone reference: 390 wide. The panes cross the TV's right edge and fall onto the shelf.
const PHONE: Scene = {
  view: [470, 1000],
  offset: [40, 40],
  fit: "xMidYMin meet",
  windows: [{ at: [250, -10], across: [1, -0.06], down: [-0.42, 1], cols: 2, rows: 3, pane: [74, 150], bar: 9 }],
};

function Panes({ w, dx, dy }: { w: WindowShape; dx: number; dy: number }) {
  const m = `matrix(${w.across[0]} ${w.across[1]} ${w.down[0]} ${w.down[1]} ${w.at[0] + dx} ${w.at[1] + dy})`;
  const rects = [];
  for (let r = 0; r < w.rows; r++)
    for (let c = 0; c < w.cols; c++)
      rects.push(<rect key={`${r}-${c}`} x={c * (w.pane[0] + w.bar)} y={r * (w.pane[1] + w.bar)} width={w.pane[0]} height={w.pane[1]} />);
  return <g transform={m}>{rects}</g>;
}

type Kind = "shade" | "warm" | "bloom" | "sun";

function Layer({ scene, kind, tag }: { scene: Scene; kind: Kind; tag: string }) {
  const [vw, vh] = scene.view;
  const [dx, dy] = scene.offset;
  const panes = scene.windows.map((w, i) => <Panes key={i} w={w} dx={dx} dy={dy} />);
  const big = { x: -vw, y: -vh, width: vw * 3, height: vh * 6 };
  const maskId = `dl-cut-${tag}`;
  return (
    <svg className={`dl-layer dl-${kind}`} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio={scene.fit} aria-hidden focusable="false">
      {kind === "shade" ? (
        <>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" {...big}>
              <rect {...big} fill="#fff" />
              <g fill="#000">{panes}</g>
            </mask>
          </defs>
          <rect className="dl-fill" {...big} mask={`url(#${maskId})`} />
        </>
      ) : kind === "bloom" ? (
        <>
          <defs>
            <filter id={`dl-soft-${tag}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="30" />
            </filter>
          </defs>
          <g className="dl-fill" filter={`url(#dl-soft-${tag})`}>
            {panes}
          </g>
        </>
      ) : (
        <g className="dl-fill">{panes}</g>
      )}
    </svg>
  );
}

function SceneLayers({ scene, tag, className }: { scene: Scene; tag: string; className: string }) {
  return (
    <div className={`dl-set ${className}`}>
      <Layer scene={scene} kind="shade" tag={tag} />
      <Layer scene={scene} kind="bloom" tag={tag} />
      <Layer scene={scene} kind="sun" tag={tag} />
      <Layer scene={scene} kind="warm" tag={tag} />
    </div>
  );
}

export default function Daylight() {
  return (
    <div className="daylight" aria-hidden>
      <SceneLayers scene={DESK} tag="d" className="dl-desk" />
      <SceneLayers scene={PHONE} tag="p" className="dl-phone" />
    </div>
  );
}
