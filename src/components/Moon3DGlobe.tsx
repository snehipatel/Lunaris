import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Crater } from '../types/crater';
import { createLunarThreeTexture } from '../utils/lunarTexture';

interface Moon3DGlobeProps {
  craters: Crater[];
  selectedCrater: Crater | null;
  onSelectCrater: (crater: Crater) => void;
  layers: {
    dfsar: boolean;
    ohrc: boolean;
    psr: boolean;
    illumination: boolean;
  };
}

export const Moon3DGlobe: React.FC<Moon3DGlobeProps> = ({
  craters,
  selectedCrater,
  onSelectCrater,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredCrater, setHoveredCrater] = useState<Crater | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [currentLatLon, setCurrentLatLon] = useState({ lat: -85.632, lon: 123.847 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -2.8, 1.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const texture = createLunarThreeTexture();

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.1,
    });

    const moonMesh = new THREE.Mesh(geometry, material);
    moonMesh.rotation.x = Math.PI / 2;
    scene.add(moonMesh);

    const glowGeom = new THREE.SphereGeometry(1.005, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    moonMesh.add(glowMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 2);
    scene.add(sunLight);

    const pinGroup = new THREE.Group();
    moonMesh.add(pinGroup);

    function latLonToVector3(lat: number, lon: number, radius = 1.01): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    }

    const pinMeshes: { mesh: THREE.Mesh; crater: Crater }[] = [];

    craters.forEach(c => {
      const pos = latLonToVector3(c.lat, c.lon, 1.012);

      let color = 0xef4444;
      if (c.classification === 'ICE_POSITIVE') color = 0x10b981;
      else if (c.classification === 'AMBIGUOUS') color = 0xf59e0b;

      const size = Math.max(0.012, Math.min(0.035, (c.diameter_km / 40) * 0.025));
      const markerGeom = new THREE.SphereGeometry(size, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: false,
      });

      const pinMesh = new THREE.Mesh(markerGeom, markerMat);
      pinMesh.position.copy(pos);

      if (selectedCrater && selectedCrater.id === c.id) {
        const ringGeom = new THREE.RingGeometry(size * 1.5, size * 2.2, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.lookAt(pos.clone().multiplyScalar(2));
        pinMesh.add(ringMesh);
      }

      pinGroup.add(pinMesh);
      pinMeshes.push({ mesh: pinMesh, crater: c });
    });

    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handlePointerDown = (e: MouseEvent) => {
      isMouseDown = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isMouseDown) {
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y,
        };

        moonMesh.rotation.y += deltaMove.x * 0.005;
        moonMesh.rotation.x += deltaMove.y * 0.005;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

        const intersects = raycaster.intersectObjects(pinMeshes.map(p => p.mesh));
        const firstIntersect = intersects[0];
        if (firstIntersect) {
          const hit = pinMeshes.find(p => p.mesh === firstIntersect.object);
          if (hit) {
            setHoveredCrater(hit.crater);
            setTooltipPos({ x: e.clientX, y: e.clientY });
          }
        } else {
          setHoveredCrater(null);
        }

        const moonIntersects = raycaster.intersectObject(moonMesh);
        const firstMoon = moonIntersects[0];
        if (firstMoon) {
          const point = firstMoon.point;
          const r = Math.hypot(point.x, point.y);
          const lat = -(80 + Math.min(10, r * 10));
          const lon = ((Math.atan2(point.y, point.x) * 180) / Math.PI + 360) % 360;
          setCurrentLatLon({ lat: parseFloat(lat.toFixed(3)), lon: parseFloat(lon.toFixed(3)) });
        }
      }
    };

    const handlePointerUp = () => { isMouseDown = false; };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(pinMeshes.map(p => p.mesh));
      const firstIntersect = intersects[0];

      if (firstIntersect) {
        const hit = pinMeshes.find(p => p.mesh === firstIntersect.object);
        if (hit) onSelectCrater(hit.crater);
      }
    };
    domElement.addEventListener('click', handleClick);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isMouseDown) {
        moonMesh.rotation.y += 0.0008;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElement.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [craters, selectedCrater, onSelectCrater]);

  return (
    <div className="relative w-full h-full" ref={mountRef}>
      <div className="absolute bottom-3 right-4 bg-[#0a1020]/90 border border-[#1a2540] rounded px-3 py-1 text-[11px] font-mono text-slate-300 backdrop-blur-sm z-10">
        Lat: <span className="text-cyan-300 font-bold">{Math.abs(currentLatLon.lat).toFixed(3)}°S</span>&nbsp;&nbsp;
        Lon: <span className="text-cyan-300 font-bold">{currentLatLon.lon.toFixed(3)}°E</span>
      </div>

      {hoveredCrater && (
        <div
          style={{ position: 'fixed', left: tooltipPos.x + 14, top: tooltipPos.y - 10, pointerEvents: 'none' }}
          className="z-50 bg-[#0c1427]/95 border border-cyan-500/50 px-3 py-2 rounded-lg shadow-2xl backdrop-blur text-[10px] font-mono min-w-44 space-y-0.5"
        >
          <div className="font-bold text-cyan-300 text-[11px]">{hoveredCrater.name}</div>
          <div className="text-slate-400">{hoveredCrater.lat.toFixed(3)}°S, {hoveredCrater.lon.toFixed(3)}°E</div>
          <div className="flex justify-between pt-0.5">
            <span className="text-emerald-400">CPR: {hoveredCrater.cpr}</span>
            <span className="text-cyan-400">DOP: {hoveredCrater.dop}</span>
          </div>
          <div className="flex justify-between pt-0.5 border-t border-slate-700">
            <span>Ice Prob:</span>
            <span className={`font-bold ${hoveredCrater.iceProbability > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {hoveredCrater.iceProbability}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
