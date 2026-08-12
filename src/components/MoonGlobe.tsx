import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { iceColor, type Crater } from "@/lib/craters";

const WAC = "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02";
const DEM = "https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_DEM_Global_128ppd_v04";
const SHADE = "https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_Shade_Global_128ppd_v04";
const tileUrl = (base: string, z: number, row: number, col: number, ext: string) =>
  `${base}/1.0.0/default/default028mm/${z}/${row}/${col}.${ext}`;

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Stitch an equirectangular canvas from a Moon Trek WMTS level. */
async function buildMosaic(
  base: string,
  z: number,
  ext: string,
  rowRange?: [number, number],
  maxWidth = 4096,
): Promise<HTMLCanvasElement> {
  const cols = 2 ** (z + 1);
  const rows = 2 ** z;
  const [r0, r1] = rowRange ?? [0, rows - 1];
  const nRows = r1 - r0 + 1;
  const scale = Math.min(1, maxWidth / (cols * 256));
  const tw = Math.round(256 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cols * tw;
  canvas.height = nRows * tw;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#20242c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const jobs: Array<Promise<void>> = [];
  for (let r = r0; r <= r1; r++) {
    for (let c = 0; c < cols; c++) {
      jobs.push(
        loadImage(tileUrl(base, z, r, c, ext)).then((img) => {
          if (img) ctx.drawImage(img, c * tw, (r - r0) * tw, tw, tw);
        }),
      );
    }
  }
  // Throttle: run in chunks so we don't fire hundreds of requests at once.
  const chunk = 24;
  for (let i = 0; i < jobs.length; i += chunk) {
    await Promise.all(jobs.slice(i, i + chunk));
  }
  return canvas;
}

export function latLonToVec3(lat: number, lon: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

const R_MOON_KM = 1737.4;
/** Angular radius (radians) subtended by a crater of the given diameter. */
const angRadius = (diameter_km: number) => diameter_km / 2 / R_MOON_KM;

/** Orthonormal tangent basis at a surface direction. */
function tangentBasis(dir: THREE.Vector3) {
  const up = Math.abs(dir.y) > 0.98 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const e = new THREE.Vector3().crossVectors(up, dir).normalize();
  const n = new THREE.Vector3().crossVectors(dir, e).normalize();
  return [e, n] as const;
}

/**
 * Point at angular distance `ang` from (lat,lon) along bearing `t`, projected
 * onto the sphere of radius r — keeps overlays glued to the curved surface so
 * markers, footprints and PSR rings all register on the same crater.
 */
function capPoint(dir: THREE.Vector3, e: THREE.Vector3, n: THREE.Vector3, ang: number, t: number, r: number) {
  const tangent = e.clone().multiplyScalar(Math.cos(t)).addScaledVector(n, Math.sin(t));
  return dir
    .clone()
    .multiplyScalar(Math.cos(ang))
    .addScaledVector(tangent, Math.sin(ang))
    .multiplyScalar(r);
}

/** Filled spherical cap (crater footprint) that hugs the globe surface. */
function capDisc(lat: number, lon: number, ang: number, r: number, seg = 64) {
  const dir = latLonToVec3(lat, lon, 1).normalize();
  const [e, n] = tangentBasis(dir);
  const verts: number[] = [];
  const center = dir.clone().multiplyScalar(r);
  for (let i = 0; i < seg; i++) {
    const t0 = (i / seg) * Math.PI * 2;
    const t1 = ((i + 1) / seg) * Math.PI * 2;
    const a = capPoint(dir, e, n, ang, t0, r);
    const b = capPoint(dir, e, n, ang, t1, r);
    verts.push(center.x, center.y, center.z, a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

/** Closed great-circle ring of angular radius `ang` on the sphere. */
function capRing(lat: number, lon: number, ang: number, r: number, seg = 96) {
  const dir = latLonToVec3(lat, lon, 1).normalize();
  const [e, n] = tangentBasis(dir);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= seg; i++) {
    pts.push(capPoint(dir, e, n, ang, (i / seg) * Math.PI * 2, r));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}


export interface GlobeLayers {
  dfsar: boolean;
  ohrc: boolean;
  psr: boolean;
  illumination: boolean;
}

interface Props {
  craters: Crater[];
  selectedId?: string | undefined;
  onSelect?: (c: Crater) => void;
  layers: GlobeLayers;
  path?: Array<{ lat: number; lon: number; slope: number; phase?: 1 | 2 }>;
  /** Zoom straight to the selected crater as soon as the globe mounts. */
  frameOnMount?: boolean;
  className?: string;
}

export default function MoonGlobe({
  craters,
  selectedId,
  onSelect,
  layers,
  path,
  frameOnMount = false,
  className,
}: Props) {

  const mount = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading LRO WAC mosaic + LOLA DEM…");
  const [hover, setHover] = useState<{ c: Crater; x: number; y: number } | null>(null);
  const api = useRef<{
    markers: THREE.Group;
    overlays: Record<string, THREE.Object3D>;
    path?: THREE.Object3D | undefined;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    scene: THREE.Scene;
    raycaster: THREE.Raycaster;
    renderer: THREE.WebGLRenderer;
  } | null>(null);
  const cratersRef = useRef(craters);
  cratersRef.current = craters;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  // ---- scene setup (once) ----
  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.005, 200);
    // The default view looks along -Y (down onto the south pole), so +Z is used
    // as "up"; keeping (0,1,0) would be parallel to the view axis and make the
    // lookAt degenerate (target drifting off-centre).
    camera.up.set(0, 0, 1);
    camera.position.set(0.55, -2.6, 1.05);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.domElement.style.touchAction = "none";
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 1.02;
    controls.maxDistance = 8;
    // Free rotation on every axis — no polar/azimuth clamping, so the globe can
    // be spun over the poles and all the way around.
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.panSpeed = 0.6;

    scene.add(new THREE.AmbientLight(0xbfd4ff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.position.set(4, -0.35, 2.5);
    scene.add(sun);

    const geo = new THREE.SphereGeometry(1, 320, 200);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
      displacementScale: 0.006,
      displacementBias: -0.003,
    });
    const moon = new THREE.Mesh(geo, mat);
    scene.add(moon);

    // ---- deep-space backdrop: layered starfield + faint nebula shells ----
    const starLayers: Array<[number, number, number, number]> = [
      // count, radius, size, color
      [2600, 60, 0.16, 0xdfe9ff],
      [1400, 90, 0.28, 0x9fc4ff],
      [700, 120, 0.45, 0x7fa8ff],
    ];
    starLayers.forEach(([count, radius, size, color]) => {
      const g = new THREE.BufferGeometry();
      const sp = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const v = new THREE.Vector3()
          .randomDirection()
          .multiplyScalar(radius * (0.7 + Math.random() * 0.6));
        sp[i * 3] = v.x;
        sp[i * 3 + 1] = v.y;
        sp[i * 3 + 2] = v.z;
      }
      g.setAttribute("position", new THREE.BufferAttribute(sp, 3));
      scene.add(
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            color,
            size,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
          }),
        ),
      );
    });
    // Two huge additive shells give the sky a soft nebula wash.
    ([
      [0x1b2f6b, 150, 0.16],
      [0x4a1f5c, 170, 0.1],
    ] as Array<[number, number, number]>).forEach(([color, r, opacity]) => {
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 24),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.BackSide,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      scene.add(shell);
    });


    const markers = new THREE.Group();
    scene.add(markers);
    const overlays: Record<string, THREE.Object3D> = {};

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.01 };

    api.current = { markers, overlays, camera, controls, scene, raycaster, renderer };


    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    const tick = () => {
      controls.update();
      const d = camera.position.length();
      const mk = Math.min(1.1, Math.max(0.22, (d - 1) * 0.55));
      markers.children.forEach((m) => {
        if (m.userData['fixed'] !== true) m.scale.setScalar(mk);
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    // textures
    (async () => {
      const color = await buildMosaic(WAC, 3, "jpg");
      if (disposed) return;
      const ct = new THREE.CanvasTexture(color);
      ct.colorSpace = THREE.SRGBColorSpace;
      ct.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mat.map = ct;
      mat.needsUpdate = true;
      setStatus("Draping LOLA elevation…");
      const dem = await buildMosaic(DEM, 3, "png");
      if (disposed) return;
      const dt = new THREE.CanvasTexture(dem);
      mat.displacementMap = dt;
      mat.bumpMap = dt;
      mat.bumpScale = 6;
      mat.needsUpdate = true;
      setStatus("Loading south-polar high-resolution inset…");
      // High-res polar cap (lat -90 .. -78.75) as a second, slightly raised shell.
      const capCanvas = await buildMosaic(WAC, 5, "jpg", [30, 31], 8192);
      if (disposed) return;
      const capTex = new THREE.CanvasTexture(capCanvas);
      capTex.colorSpace = THREE.SRGBColorSpace;
      capTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const capGeo = new THREE.SphereGeometry(
        1.0006,
        512,
        96,
        0,
        Math.PI * 2,
        (168.75 * Math.PI) / 180,
        (11.25 * Math.PI) / 180,
      );
      const capMat = new THREE.MeshStandardMaterial({
        map: capTex,
        // No displacementMap here: the cap band has its own 0–1 UV range, so the
        // global DEM texture would be stretched and shift crater positions.
        bumpMap: capTex,

        bumpScale: 4,
        roughness: 1,
      });
      scene.add(new THREE.Mesh(capGeo, capMat));
      setStatus("");
    })();

    // picking
    const pick = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(markers.children, false);
      const first = hits[0]?.object as THREE.Mesh | undefined;
      const id = first?.userData?.["id"] as string | undefined;
      const c = id ? cratersRef.current.find((k) => k.crater_id === id) : undefined;
      return { c, x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e: PointerEvent) => {
      const { c, x, y } = pick(e);
      renderer.domElement.style.cursor = c ? "pointer" : "grab";
      setHover(c ? { c, x, y } : null);
    };
    const onClick = (e: PointerEvent) => {
      const { c } = pick(e);
      if (c) selectRef.current?.(c);
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onClick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onClick);
      controls.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      api.current = null;
    };
  }, []);

  // ---- markers ----
  // All overlays are generated as true spherical caps at fixed radii just above
  // the displaced surface (displacement is ±0.003), so a crater's marker, its
  // ice footprint and its PSR ring share exactly the same centre and scale.
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const g = a.markers;
    g.clear();
    const sphere = new THREE.SphereGeometry(0.0035, 12, 12);
    craters.forEach((c) => {
      const ang = angRadius(c.diameter_km);
      const col = new THREE.Color(iceColor(c.ice_probability));

      // ice-probability footprint, exact angular size of the crater
      const disc = new THREE.Mesh(
        capDisc(c.lat, c.lon, ang, 1.0035),
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      disc.userData["id"] = c.crater_id;
      disc.userData["fixed"] = true;
      g.add(disc);

      // crisp rim outline at the same radius
      const outline = new THREE.Line(
        capRing(c.lat, c.lon, ang, 1.004),
        new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85 }),
      );
      outline.userData["fixed"] = true;
      g.add(outline);

      // centre marker
      const m = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: col }));
      m.position.copy(latLonToVec3(c.lat, c.lon, 1.005));
      m.userData["id"] = c.crater_id;
      g.add(m);

      if (c.crater_id === selectedId) {
        const sel = new THREE.Line(
          capRing(c.lat, c.lon, ang * 1.35 + 0.002, 1.0045),
          new THREE.LineBasicMaterial({ color: 0x67e8f9 }),
        );
        sel.userData["fixed"] = true;
        g.add(sel);
      }
    });
  }, [craters, selectedId]);

  // ---- toggleable layers ----
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const make = (key: keyof GlobeLayers) => {
      if (a.overlays[key]) return a.overlays[key]!;
      let obj: THREE.Object3D;
      if (key === "psr") {
        const grp = new THREE.Group();
        cratersRef.current
          .filter((c) => c.psr_status === "doubly shadowed" && c.diameter_km > 18)
          .forEach((c) => {
            const ang = angRadius(c.diameter_km) * 0.86; // PSR sits inside the rim
            const ring = new THREE.Line(
              capRing(c.lat, c.lon, ang, 1.0042),
              new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 }),
            );
            grp.add(ring);
            const fill = new THREE.Mesh(
              capDisc(c.lat, c.lon, ang, 1.0032),
              new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.12,
                side: THREE.DoubleSide,
                depthWrite: false,
              }),
            );
            grp.add(fill);
          });
        obj = grp;
      } else if (key === "illumination") {
        obj = new THREE.Mesh(
          new THREE.SphereGeometry(1.0028, 128, 96, 0, Math.PI * 2, (150 * Math.PI) / 180, Math.PI / 6),
          new THREE.MeshBasicMaterial({
            color: 0x0b1120,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
      } else {
        const color = key === "dfsar" ? 0x22d3ee : 0xfbbf24;
        obj = new THREE.Mesh(
          new THREE.SphereGeometry(
            key === "dfsar" ? 1.0024 : 1.0026,
            96,
            64,
            0,
            Math.PI * 2,
            (140 * Math.PI) / 180,
            (40 * Math.PI) / 180,
          ),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: key === "dfsar" ? 0.07 : 0.06,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
      }
      a.overlays[key] = obj;
      a.scene.add(obj);
      return obj;
    };
    (["dfsar", "ohrc", "psr", "illumination"] as const).forEach((k) => {
      const o = make(k);
      o.visible = layers[k];
    });
  }, [layers]);

  // ---- traverse path ----
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    if (a.path) {
      a.scene.remove(a.path);
      a.path = undefined;
    }
    if (!path || path.length < 2) return;
    const grp = new THREE.Group();
    const R = 1.0055;
    for (let i = 0; i < path.length - 1; i++) {
      const p0 = path[i]!;
      const p1 = path[i + 1]!;
      // Phase 1 (to the rim) is drawn cyan, phase 2 (inside the PSR) magenta;
      // without phase info fall back to slope colouring.
      const col =
        p0.phase === 1
          ? 0x38bdf8
          : p0.phase === 2
            ? 0xe879f9
            : p0.slope < 5
              ? 0x22c55e
              : p0.slope < 10
                ? 0xeab308
                : p0.slope < 15
                  ? 0xf97316
                  : 0xef4444;
      const from = latLonToVec3(p0.lat, p0.lon, R);
      const to = latLonToVec3(p1.lat, p1.lon, R);
      const mid = from.clone().add(to).normalize().multiplyScalar(R);
      const curve = new THREE.CatmullRomCurve3([from, mid, to]);
      grp.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, 4, p0.phase === 2 ? 0.0008 : 0.0006, 6, false),
          new THREE.MeshBasicMaterial({ color: col }),
        ),
      );
    }
    // phase-handoff marker at the crater rim
    const hand = path.find((p) => p.phase === 2);
    if (hand) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.0026, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
      );
      dot.position.copy(latLonToVec3(hand.lat, hand.lon, R));
      grp.add(dot);
    }

    // start (landing site) and end (ice zone) markers
    const ends: Array<[{ lat: number; lon: number }, number]> = [
      [path[0]!, 0x67e8f9],
      [path[path.length - 1]!, 0xf472b6],
    ];
    ends.forEach(([p, color]) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.0022, 12, 12),
        new THREE.MeshBasicMaterial({ color }),
      );
      dot.position.copy(latLonToVec3(p.lat, p.lon, R));
      grp.add(dot);
      grp.add(
        new THREE.Line(
          capRing(p.lat, p.lon, 0.0035, R),
          new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }),
        ),
      );
    });
    a.path = grp;
    a.scene.add(grp);
  }, [path]);

  // frame the selected crater (also on first mount so single-crater views such
  // as the traverse plan open already looking at the target)
  const framedOnce = useRef(false);
  useEffect(() => {
    if (!selectedId) return;
    if (!framedOnce.current && !frameOnMount) {
      framedOnce.current = true;
      return;
    }
    framedOnce.current = true;
    const c = cratersRef.current.find((k) => k.crater_id === selectedId);
    if (!c) return;
    const dir = latLonToVec3(c.lat, c.lon, 1).normalize();
    let raf = 0;
    let t = 0;
    let from: THREE.Vector3 | null = null;

    const step = () => {
      const cur = api.current;
      // The scene is built asynchronously (textures), so wait for it.
      if (!cur) {
        raf = requestAnimationFrame(step);
        return;
      }
      if (!from) from = cur.camera.position.clone();
      const dist = frameOnMount
        ? Math.max(1.03, 1 + Math.max(0.02, angRadius(c.diameter_km) * 5))
        : Math.max(1.35, from.length() * 0.8);
      // Orbit around the crater itself so it stays exactly centred.
      const focus = dir.clone().multiplyScalar(1);
      const to = dir.clone().multiplyScalar(dist);
      t += 0.06;
      const k = Math.min(1, t);
      cur.camera.position.lerpVectors(from, to, k);
      cur.controls.target.lerpVectors(new THREE.Vector3(0, 0, 0), focus, k);
      cur.controls.update();
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [selectedId, frameOnMount]);





  const legend = useMemo(() => [0, 0.25, 0.5, 0.75, 1].map((v) => iceColor(v)), []);

  return (
    <div className={className}>
      <div ref={mount} className="relative h-full w-full overflow-hidden">
        {status && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded border border-border bg-card/85 px-3 py-1.5 font-mono text-[11px] tracking-wide text-primary">
            {status}
          </div>
        )}
        {hover && (
          <div
            className="pointer-events-none absolute z-20 min-w-[9rem] rounded border border-primary/40 bg-card/95 px-2 py-1.5 text-[11px] shadow-lg"
            style={{ left: hover.x + 12, top: hover.y + 12 }}
          >
            <div className="font-display text-sm tracking-wide text-foreground">{hover.c.name}</div>
            <div className="font-mono text-muted-foreground">
              {hover.c.crater_id} · {hover.c.lat}°, {hover.c.lon}°
            </div>
            <div className="font-mono">
              ice p={hover.c.ice_probability} · CPR {hover.c.cpr} · DOP {hover.c.dop}
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-center">
          <div
            className="h-2 w-56 rounded-sm"
            style={{ background: `linear-gradient(90deg, ${legend.join(",")})` }}
          />
          <div className="mt-1 flex w-56 justify-between font-mono text-[9px] text-muted-foreground">
            <span>0</span>
            <span>ICE PROBABILITY SCORE</span>
            <span>1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
