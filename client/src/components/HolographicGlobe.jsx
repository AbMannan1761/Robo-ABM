import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const HolographicGlobe = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Wireframe Sphere
    const globeGeo = new THREE.SphereGeometry(4.2, 28, 28);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Glowing Hotspots
    const hotspotGeo = new THREE.BufferGeometry();
    const hotspotCount = 35;
    const hotspotPos = new Float32Array(hotspotCount * 3);

    for (let i = 0; i < hotspotCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 4.25;

      hotspotPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      hotspotPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      hotspotPos[i * 3 + 2] = r * Math.cos(phi);
    }

    hotspotGeo.setAttribute('position', new THREE.BufferAttribute(hotspotPos, 3));
    const hotspotMat = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: 0.25,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const hotspots = new THREE.Points(hotspotGeo, hotspotMat);
    globe.add(hotspots);

    // Equatorial scanning ring
    const ringGeo = new THREE.RingGeometry(4.8, 4.9, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      globe.rotation.y += 0.006;
      globe.rotation.x = 0.2;
      ring.rotation.z += 0.003;
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
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      globeGeo.dispose();
      globeMat.dispose();
      hotspotGeo.dispose();
      hotspotMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
      <div ref={mountRef} className="w-full h-44 sm:h-52" />
      <div className="flex items-center justify-between w-full px-3 text-[11px] font-mono text-cyan-400/80">
        <span>SAT-LINK: ACTIVE</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          HOTSPOTS: 35
        </span>
      </div>
    </div>
  );
};

export default HolographicGlobe;
