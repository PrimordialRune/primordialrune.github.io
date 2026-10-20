"use client";

import { useEffect, useRef, type JSX } from "react";

/**
 * Emblem3D: the PrimordialRune logo as a real-time 3D emblem.
 *
 * Rendered with three.js's WebGPURenderer (falls back to WebGL2 on its own).
 * three is lazy-loaded inside the effect so none of it lands in the main
 * bundle, and nothing touches `window` at module scope (static export safe).
 *
 * If init fails, `onBackend("none")` fires and the canvas stays empty so the
 * parent can show its SVG fallback.
 */

export type EmblemBackend = "webgpu" | "webgl2" | "none";

type Props = {
  /** 0..1. Turns the inner shape from blood orange to warning red. */
  corruption?: number;
  /** While true, the inner shape pulses like a mouth flapping. */
  speaking?: boolean;
  /** Reduced motion: static frames only, re-rendered on prop changes/resize. */
  reduced?: boolean;
  className?: string;
  onBackend?: (b: EmblemBackend) => void;
};

// Logo paths (viewBox 0 0 554.72 555)
const OUTER_D =
  "M260.32,454.02l-159.33-159.33c-8.33-8.33-8.33-21.82,0-30.15l168.17-168.17c4-4,9.42-6.24,15.08-6.24h159.92c5.17,0,6.81-6.96,2.19-9.27L289.14,2.25c-8.21-4.1-18.12-2.5-24.61,3.99L6.24,264.53c-8.33,8.33-8.33,21.82,0,30.15l254.08,254.08c8.33,8.33,21.82,8.33,30.15,0l260.8-260.79c3.08-3.08.9-8.36-3.46-8.36h-72.56c-6.63,0-13,2.64-17.69,7.33l-167.08,167.08c-8.33,8.33-21.82,8.33-30.15,0Z";
const INNER_D =
  "M551.25,137.49h-263.74c-7.75,0-15.19,3.08-20.67,8.56l-125.39,125.39c-3.01,3.01-.88,8.16,3.38,8.16h101.34c16.14,0,29.23,13.09,29.23,29.23v101.34c0,4.26,5.15,6.39,8.16,3.38l270.14-270.14c2.19-2.19.64-5.92-2.45-5.92Z";

// Brand palette
const PEACOCK = 0x102f41;
const TEAL = 0x339999;
const AQUAMARINE = 0x4eb99f;
const CREAM = 0xfce8cd;
const BLOOD_ORANGE = 0xec563b;
const WARNING_RED = 0xd0213a; // reserved: corruption only

const OUTER_DEPTH = 60;
const INNER_DEPTH = 60;
const INNER_PROUD = 26; // inner cap sits this many units in front of the outer cap

const DEG = Math.PI / 180;
const FOV = 30;
const FILL = 0.8; // emblem fills ~80% of the shorter side

export default function Emblem3D({
  corruption = 0,
  speaking = false,
  reduced = false,
  className,
  onBackend,
}: Props): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);

  // Live props, read every frame without restarting the effect.
  const corruptionRef = useRef(corruption);
  const speakingRef = useRef(speaking);
  const reducedRef = useRef(reduced);
  const onBackendRef = useRef(onBackend);
  /** Set by the effect: wake the loop or draw one frame (reduced). */
  const invalidateRef = useRef<() => void>(() => {});

  useEffect(() => {
    corruptionRef.current = Math.min(1, Math.max(0, corruption));
    speakingRef.current = speaking;
    reducedRef.current = reduced;
    invalidateRef.current();
  }, [corruption, speaking, reduced]);

  useEffect(() => {
    onBackendRef.current = onBackend;
  }, [onBackend]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let reported: EmblemBackend | null = null;
    const report = (b: EmblemBackend) => {
      // Once per mount; the only later call is a downgrade to "none" if a
      // renderer that already drew dies mid-session and the retry fails.
      if (b === "none") delete host.dataset.backend;
      if (cancelled || reported === b || (reported && b !== "none")) return;
      reported = b;
      onBackendRef.current?.(b);
    };

    // Everything the current attempt allocated, run in reverse on teardown.
    // Idempotent: anything pushed after a teardown runs on the next call.
    const cleanups: Array<() => void> = [];
    const runCleanups = () => {
      while (cleanups.length) {
        try {
          cleanups.pop()!();
        } catch {
          // ignore disposal errors
        }
      }
    };

    /**
     * One attempt at bringing the emblem up. `forceWebGL` is the retry path:
     * some browsers expose WebGPU but reject parts of three's usage at draw
     * time (e.g. Chromium 141 rejects the string `swizzle` on texture views),
     * and a canvas that has handed out a WebGPU context can't give a WebGL2
     * one, so each attempt gets a fresh canvas.
     */
    const start = async (
      forceWebGL: boolean,
      fail: (err: unknown) => void,
    ): Promise<void> => {
      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      Object.assign(canvas.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        display: "block",
      });
      host.appendChild(canvas);
      cleanups.push(() => canvas.remove());

      const THREE = await import("three/webgpu");
      const { SVGLoader } = await import(
        "three/examples/jsm/loaders/SVGLoader.js"
      );
      const { RoomEnvironment } = await import(
        "three/examples/jsm/environments/RoomEnvironment.js"
      );
      if (cancelled) return runCleanups();

      // ---------- renderer ----------
      const renderer = new THREE.WebGPURenderer({
        canvas,
        antialias: true,
        alpha: true,
        forceWebGL,
      });
      cleanups.push(() => renderer.dispose());
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.0;
      await renderer.init();
      if (cancelled) return runCleanups();
      // A lost GPU device leaves a blank canvas: treat it like a draw error
      // (tear down and retry on WebGL2, or give up).
      renderer.onDeviceLost = (info) => {
        fail(new Error(`device lost: ${info.message}`));
      };

      const backend = renderer.backend as { isWebGPUBackend?: boolean };
      const backendName: EmblemBackend = backend.isWebGPUBackend
        ? "webgpu"
        : "webgl2";

      // ---------- scene ----------
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);

      // Soft reflections from a neutral room (gives the plastic its edges).
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        const envRT = pmrem.fromScene(room, 0.04);
        scene.environment = envRT.texture;
        scene.environmentIntensity = 0;
        cleanups.push(() => {
          envRT.dispose();
          pmrem.dispose();
          room.traverse((o) => {
            const m = o as { geometry?: { dispose(): void }; material?: { dispose(): void } };
            m.geometry?.dispose();
            m.material?.dispose();
          });
        });
      } catch {
        // Environment is optional; lights alone still read.
      }

      const hemi = new THREE.HemisphereLight(CREAM, PEACOCK, 2.3);
      scene.add(hemi);

      const key = new THREE.DirectionalLight(CREAM, 2.0);
      key.position.set(-2.2, 3, 4);
      scene.add(key);

      // Close cream point light: gives the clearcoat a soft gloss spot that
      // slides across the faces as the emblem tilts (reads as plastic).
      const gloss = new THREE.PointLight(CREAM, 1.4, 0, 2);
      gloss.position.set(-0.4, 0.45, 1.3);
      scene.add(gloss);

      const fill = new THREE.DirectionalLight(AQUAMARINE, 0.35);
      fill.position.set(3, -1, 3);
      scene.add(fill);

      // Teal rim from behind: catches the bevels so the dark crown reads
      // against the matching peacock screen.
      const rimL = new THREE.DirectionalLight(TEAL, 8);
      rimL.position.set(-4, 2, -2.5);
      scene.add(rimL);
      const rimR = new THREE.DirectionalLight(TEAL, 8);
      rimR.position.set(4, -1.5, -2.5);
      scene.add(rimR);
      const rimT = new THREE.DirectionalLight(TEAL, 6);
      rimT.position.set(0.5, 4, -2);
      scene.add(rimT);

      // ---------- geometry ----------
      const loader = new SVGLoader();
      const svgShapes = (d: string) => {
        const data = loader.parse(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 554.72 555"><path d="${d}"/></svg>`,
        );
        return data.paths.flatMap((p) => p.toShapes());
      };

      const makeGeo = (d: string, depth: number) => {
        const g = new THREE.ExtrudeGeometry(svgShapes(d), {
          depth,
          curveSegments: 16,
          bevelEnabled: true,
          bevelThickness: 7,
          bevelSize: 4.5,
          bevelOffset: 0,
          bevelSegments: 5,
        });
        // Flip SVG y-down with a proper rotation (keeps winding/normals):
        // y -> -y, z -> -z, so the extrusion goes into the screen and the
        // cap at z=0 faces the camera.
        g.rotateX(Math.PI);
        return g;
      };

      const outerGeo = makeGeo(OUTER_D, OUTER_DEPTH);
      const innerGeo = makeGeo(INNER_D, INNER_DEPTH);

      // Centre both on the outer shape's bounds and normalise to unit size.
      outerGeo.computeBoundingBox();
      const bb = outerGeo.boundingBox!;
      const cx = (bb.min.x + bb.max.x) / 2;
      const cy = (bb.min.y + bb.max.y) / 2;
      const size = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y);
      const s = 1 / size;
      for (const g of [outerGeo, innerGeo]) {
        g.translate(-cx, -cy, 0);
        g.scale(s, s, s);
      }
      const outerFrontZ = INNER_PROUD * s;

      const outerMat = new THREE.MeshPhysicalMaterial({
        color: PEACOCK,
        roughness: 0.6,
        metalness: 0,
        specularIntensity: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.2,
        // Teal sheen only shows at grazing angles: lights the bevels so the
        // peacock crown separates from the peacock screen.
        sheen: 0.8,
        sheenColor: new THREE.Color(TEAL),
        sheenRoughness: 0.45,
      });
      const innerColor = new THREE.Color(BLOOD_ORANGE);
      const orange = new THREE.Color(BLOOD_ORANGE);
      const red = new THREE.Color(WARNING_RED);
      const innerMat = new THREE.MeshPhysicalMaterial({
        color: innerColor,
        roughness: 0.5,
        metalness: 0,
        specularIntensity: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.2,
        emissive: new THREE.Color(WARNING_RED),
        emissiveIntensity: 0,
      });
      cleanups.push(() => {
        outerGeo.dispose();
        innerGeo.dispose();
        outerMat.dispose();
        innerMat.dispose();
      });

      const outer = new THREE.Mesh(outerGeo, outerMat);
      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.position.z = outerFrontZ;

      // Scale the inner shape around its own centre for the speaking pulse.
      innerGeo.computeBoundingBox();
      const ib = innerGeo.boundingBox!;
      const icx = (ib.min.x + ib.max.x) / 2;
      const icy = (ib.min.y + ib.max.y) / 2;
      innerGeo.translate(-icx, -icy, 0);
      const innerPivot = new THREE.Group();
      innerPivot.position.set(icx, icy, 0);
      innerPivot.add(inner);

      const emblem = new THREE.Group(); // tilt + float
      emblem.add(outer, innerPivot);
      // Pull the whole stack back so its depth centre sits at the origin.
      const stack = new THREE.Group();
      stack.position.z = -(outerFrontZ - OUTER_DEPTH * s) / 2;
      stack.add(emblem);
      scene.add(stack);

      // ---------- sizing ----------
      const fitCamera = (w: number, h: number) => {
        const aspect = w / h;
        camera.aspect = aspect;
        const t = Math.tan((FOV * DEG) / 2);
        // visible height needed so unit emblem = FILL of the shorter side
        const visH = aspect >= 1 ? 1 / FILL : 1 / (FILL * aspect);
        camera.position.set(0, 0, visH / (2 * t));
        camera.near = 0.05;
        camera.far = camera.position.z + 10;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      };

      let width = 0;
      let height = 0;
      const resize = () => {
        const r = host.getBoundingClientRect();
        const w = Math.max(1, Math.round(r.width));
        const h = Math.max(1, Math.round(r.height));
        if (w === width && h === height) return;
        width = w;
        height = h;
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.setSize(w, h, false);
        fitCamera(w, h);
        invalidate();
      };

      // ---------- motion state ----------
      const pointer = { x: 0, y: 0 }; // -1..1 target
      const tilt = { x: 0, y: 0 }; // eased
      let speakAmt = 0; // eased 0..1 envelope
      let jitterUntil = 0;
      let nextJitterCheck = 0;
      let jitterX = 0;
      let last = performance.now();
      const t0 = last;

      let raf = 0;
      let visible = !document.hidden;
      let onScreen = true;

      const applyFrame = (now: number, dt: number) => {
        const isReduced = reducedRef.current;
        const c = corruptionRef.current;
        const t = (now - t0) / 1000;

        // Corruption colour + faint emissive glow
        innerColor.copy(orange).lerp(red, c);
        innerMat.color.copy(innerColor);

        // Speaking envelope
        const speakTarget = speakingRef.current ? 1 : 0;
        if (isReduced) speakAmt = speakTarget;
        else speakAmt += (speakTarget - speakAmt) * (1 - Math.exp(-dt * 10));

        let mouth = 0;
        if (!isReduced && speakAmt > 0.001) {
          // Irregular ~6Hz flap: two detuned sines, rectified, gated by a slow wobble.
          const a = Math.sin(t * 2 * Math.PI * 5.7);
          const b = Math.sin(t * 2 * Math.PI * 3.1 + 1.3);
          const gate = 0.55 + 0.45 * Math.sin(t * 2 * Math.PI * 0.9);
          mouth = Math.max(0, a * 0.65 + b * 0.35) * gate * speakAmt;
        }
        const pulse = 1 + 0.04 * mouth;
        innerPivot.scale.set(pulse, pulse, 1);
        innerMat.emissiveIntensity =
          c * 0.35 + mouth * 0.25 + (isReduced ? speakAmt * 0.1 : 0);
        // Speaking glow uses the current inner hue so it's not red at c=0.
        innerMat.emissive.copy(c > 0.02 ? red : innerColor);

        // Corruption jitter
        if (!isReduced && c > 0.5) {
          if (now >= nextJitterCheck && now >= jitterUntil) {
            const chance = (c - 0.5) * 2 * 0.35; // per check
            if (Math.random() < chance) {
              jitterUntil = now + 80 + Math.random() * 220;
            }
            nextJitterCheck = now + 400 + Math.random() * 700;
          }
          if (now < jitterUntil) {
            jitterX = (Math.random() * 2 - 1) * 0.025 * c;
          } else {
            jitterX = 0;
          }
        } else {
          jitterX = 0;
        }
        inner.position.x = jitterX;

        // Float + tilt
        if (isReduced) {
          emblem.position.y = 0;
          emblem.rotation.set(0, 0, 0);
          tilt.x = tilt.y = 0;
        } else {
          const k = 1 - Math.exp(-dt * 6);
          tilt.x += (pointer.y * 12 * DEG - tilt.x) * k;
          tilt.y += (pointer.x * 12 * DEG - tilt.y) * k;
          const phase = (t / 6) * 2 * Math.PI;
          emblem.position.y = Math.sin(phase) * 0.02;
          emblem.rotation.x = tilt.x + Math.sin(phase * 0.5 + 0.7) * 1.5 * DEG;
          emblem.rotation.y = tilt.y + Math.sin(phase) * 8 * DEG;
        }
      };

      const draw = () => {
        renderer.render(scene, camera);
      };

      const tick = (now: number) => {
        raf = 0;
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        applyFrame(now, dt);
        try {
          draw();
        } catch (err) {
          fail(err);
          return;
        }
        if (!reducedRef.current && visible && onScreen) {
          raf = requestAnimationFrame(tick);
        }
      };

      function invalidate() {
        if (cancelled) return;
        if (raf) return;
        if (reducedRef.current) {
          // Single frame on demand.
          raf = requestAnimationFrame(tick);
        } else if (visible && onScreen) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        }
      }
      invalidateRef.current = invalidate;
      cleanups.push(() => {
        invalidateRef.current = () => {};
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      });

      // ---------- listeners ----------
      const onPointer = (e: PointerEvent) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      cleanups.push(() => window.removeEventListener("pointermove", onPointer));

      const onVis = () => {
        visible = !document.hidden;
        if (visible) invalidate();
      };
      document.addEventListener("visibilitychange", onVis);
      cleanups.push(() => document.removeEventListener("visibilitychange", onVis));

      const ro = new ResizeObserver(() => resize());
      ro.observe(host);
      cleanups.push(() => ro.disconnect());

      if (typeof IntersectionObserver !== "undefined") {
        const io = new IntersectionObserver((entries) => {
          onScreen = entries.some((en) => en.isIntersecting);
          if (onScreen) invalidate();
        });
        io.observe(host);
        cleanups.push(() => io.disconnect());
      }

      resize();
      // First frame synchronously: a draw-time failure throws here and
      // the caller falls back before anything is reported.
      applyFrame(performance.now(), 0);
      draw();
      // Live backend for debugging (onBackend fires once; a later runtime
      // fallback to WebGL2 only shows up here).
      host.dataset.backend = backendName;
      report(backendName);
      invalidate();
    };

    const boot = async () => {
      const giveUp = (err: unknown) => {
        runCleanups();
        if (cancelled) return;
        console.warn("[Emblem3D] init failed", err);
        report("none");
      };
      const toWebGL = (err: unknown) => {
        runCleanups();
        if (cancelled) return;
        console.warn("[Emblem3D] WebGPU path failed, retrying on WebGL2", err);
        start(true, giveUp).catch(giveUp);
      };
      try {
        await start(false, toWebGL);
      } catch (err) {
        toWebGL(err);
      }
    };
    boot();

    return () => {
      cancelled = true;
      runCleanups();
    };
  }, []);

  return (
    <div className={className}>
      {/* canvas is created imperatively (fresh one per renderer attempt) */}
      <div
        ref={hostRef}
        style={{ position: "relative", width: "100%", height: "100%" }}
      />
    </div>
  );
}
