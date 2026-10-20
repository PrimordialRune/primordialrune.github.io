// Shared Three.js stage: loads one library object (GLB + real labels) into a scene.
// Used by the review page and by the export script that bakes labelled GLBs.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder); // the site ships meshopt-compressed models
// Artifact pages may not fetch data:/blob: URLs, so decode images through <img> instead of fetch().
loader.register((parser) => { parser.textureLoader = new THREE.TextureLoader(parser.options.manager); return { name: 'img_textures' }; });

// Models ship as {"glb": base64} JSON because artifact hosting does not serve .glb files.
async function loadModel(url) {
  if (!url.endsWith('.json')) return loader.loadAsync(url);
  const { glb } = await fetch(url).then((r) => r.json());
  const bytes = Uint8Array.from(atob(glb), (c) => c.charCodeAt(0));
  return loader.parseAsync(bytes.buffer, '');
}
const texLoader = new THREE.TextureLoader();
const texCache = new Map();

export function loadTexture(url) {
  if (!texCache.has(url)) {
    texCache.set(url, texLoader.loadAsync(url).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    }));
  }
  return texCache.get(url);
}

// Every object is normalised so its longest side is 1 unit and it sits centred on the origin.
function normalise(root, upright) {
  // upright: rotations in degrees applied in order, e.g. [['x', 90], ['z', 90]].
  for (const [axis, deg] of upright || []) {
    root.rotateOnWorldAxis(new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0), THREE.MathUtils.degToRad(deg));
  }
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const s = 1 / Math.max(size.x, size.y, size.z);
  const wrap = new THREE.Group();
  wrap.add(root);
  root.position.sub(box.getCenter(new THREE.Vector3()));
  wrap.scale.setScalar(s);
  const out = new THREE.Group();
  out.add(wrap);
  out.updateMatrixWorld(true);
  return out;
}

async function buildProcedural(item) {
  if (item.procedural === 'playmat') {
    const tex = await loadTexture(item.map);
    const geo = new RoundedBoxGeometry(1, 0.006, 1006 / 1729, 4, 0.02);
    const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 });
    const side = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
    // RoundedBoxGeometry has one group, so map the top face by remapping UVs from x/z.
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, pos.getX(i) + 0.5, 1 - (pos.getZ(i) / (1006 / 1729) + 0.5));
    }
    const mesh = new THREE.Mesh(geo, [top, side]);
    mesh.material = top;
    mesh.name = 'Playmat';
    const g = new THREE.Group();
    g.add(mesh);
    return g;
  }
  if (item.procedural === 'booklet') {
    // A stapled rulebook: printed cover on top, paper edges and a plain back.
    const tex = await loadTexture(item.map);
    const aspect = tex.image.width / tex.image.height;
    const paper = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.95 });
    const cover = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z.
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(aspect, 0.016, 1), [paper, paper, cover, paper, paper, paper]);
    mesh.name = 'Rulebook';
    const g = new THREE.Group();
    g.add(mesh);
    return g;
  }
  throw new Error('unknown procedural ' + item.procedural);
}

async function applyLabels(root, item) {
  for (const label of item.labels || []) {
    const tex = await loadTexture(label.img);
    if (label.type === 'material') {
      // Swap the art on the model's own label material, keeping its UVs.
      const re = new RegExp(label.match, 'i');
      root.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.userData.origMaterial) o.userData.origMaterial = Array.isArray(o.material) ? [...o.material] : o.material;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m, i) => {
          if (!re.test(m.name) && !re.test(o.name)) return;
          const t = tex.clone();
          t.flipY = false;
          if (label.repeat) t.repeat.set(...label.repeat);
          if (label.offset) t.offset.set(...label.offset);
          if (label.rotation) { t.center.set(0.5, 0.5); t.rotation = label.rotation; }
          t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
          t.needsUpdate = true;
          const nm = m.clone();
          nm.map = t;
          nm.color = new THREE.Color(0xffffff);
          if (nm.emissiveMap) nm.emissiveMap = null;
          nm.userData.realLabel = true;
          if (Array.isArray(o.material)) o.material[i] = nm; else o.material = nm;
        });
        o.userData.labelMaterial = Array.isArray(o.material) ? [...o.material] : o.material;
      });
    } else if (label.type === 'decal') {
      // A thin printed sticker placed in normalised object space.
      const geo = new THREE.PlaneGeometry(label.size[0], label.size[1]);
      const mat = new THREE.MeshStandardMaterial({
        map: tex, roughness: label.roughness ?? 0.55, metalness: 0,
        transparent: !!label.transparent, alphaTest: label.transparent ? 0.02 : 0,
        polygonOffset: true, polygonOffsetFactor: -4,
      });
      const m = new THREE.Mesh(geo, mat);
      m.name = 'RealLabel';
      m.position.set(...label.pos);
      m.rotation.set(...(label.rot || [0, 0, 0]));
      m.userData.realLabel = true;
      root.add(m);
    }
  }
}

export async function loadItem(item) {
  let root;
  if (item.procedural) root = await buildProcedural(item);
  else root = (await loadModel(item.file)).scene;
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const obj = normalise(root, item.upright);
  await applyLabels(obj, item);
  return obj;
}

export function setLabelsVisible(obj, on) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name === 'RealLabel') o.visible = on;
    if (o.userData.origMaterial && o.userData.labelMaterial) {
      o.material = on ? o.userData.labelMaterial : o.userData.origMaterial;
    }
  });
}
