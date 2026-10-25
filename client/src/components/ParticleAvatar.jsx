import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticleAvatar = ({ state = 'idle', audioVolume = 0, persona = 'jarvis' }) => {
  const mountRef = useRef(null);
  const stateRef = useRef(state);
  const volumeRef = useRef(audioVolume);
  const personaRef = useRef(persona);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    volumeRef.current = audioVolume;
  }, [audioVolume]);

  useEffect(() => {
    personaRef.current = persona;
  }, [persona]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 16;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Particles creation
    const particleCount = 4500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Generate spherical / neural core lattice
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 6.0 + (Math.random() - 0.5) * 0.8;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      // Initial color (cyan neon)
      colors[i * 3] = 0.0;     // R
      colors[i * 3 + 1] = 0.95; // G
      colors[i * 3 + 2] = 1.0;  // B
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material
    const material = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Inner glowing core
    const coreGeo = new THREE.IcosahedronGeometry(2.8, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const innerCore = new THREE.Mesh(coreGeo, coreMat);
    scene.add(innerCore);

    // Outer orbital ring
    const ringGeo = new THREE.RingGeometry(7.2, 7.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI / 3;
    scene.add(orbitalRing);

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const currentState = stateRef.current;
      const currentVol = volumeRef.current || 0;
      const currentPersona = personaRef.current;

      // Dynamic rotation
      let rotSpeed = 0.25;
      if (currentState === 'listening') rotSpeed = 0.6;
      if (currentState === 'thinking') rotSpeed = 1.6;
      if (currentState === 'speaking') rotSpeed = 0.45;

      particleSystem.rotation.y += 0.01 * rotSpeed;
      particleSystem.rotation.x = Math.sin(time * 0.4) * 0.1;

      innerCore.rotation.y -= 0.015 * rotSpeed;
      innerCore.rotation.z = Math.cos(time * 0.5) * 0.15;
      orbitalRing.rotation.z += 0.005;

      const pos = geometry.attributes.position.array;
      const col = geometry.attributes.color.array;

      // Color palette based on persona and state
      let targetR = 0.0, targetG = 0.95, targetB = 1.0; // Cyan default
      if (currentState === 'thinking') {
        targetR = 0.7; targetG = 0.2; targetB = 1.0; // Purple thinking
      } else if (currentState === 'listening') {
        targetR = 0.0; targetG = 1.0; targetB = 0.5; // Emerald listening
      } else if (currentState === 'speaking') {
        targetR = 0.1; targetG = 0.8; targetB = 1.0; // Bright Azure
      }

      if (currentPersona === 'cyberpunk') {
        targetR = 1.0; targetG = 0.0; targetB = 0.6; // Hot Pink
      }

      // Particle Displacement Calculation
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const bx = basePositions[idx];
        const by = basePositions[idx + 1];
        const bz = basePositions[idx + 2];

        let wave = Math.sin(time * 2.5 + bx * 0.4 + by * 0.4) * 0.2;
        let audioExpand = currentVol * 3.5 * Math.sin(time * 6.0 + i);

        if (currentState === 'thinking') {
          wave = Math.sin(time * 5.0 + i * 0.1) * 0.6;
        }

        const scale = 1 + (wave + audioExpand) * 0.12;
        pos[idx] = bx * scale;
        pos[idx + 1] = by * scale;
        pos[idx + 2] = bz * scale;

        // Smooth color blend
        col[idx] += (targetR - col[idx]) * 0.05;
        col[idx + 1] += (targetG - col[idx + 1]) * 0.05;
        col[idx + 2] += (targetB - col[idx + 2]) * 0.05;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;

      // Inner core pulse
      const coreScale = 1.0 + (currentState === 'speaking' ? currentVol * 1.5 : Math.sin(time * 2) * 0.08);
      innerCore.scale.set(coreScale, coreScale, coreScale);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (!newWidth || !newHeight) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
      
      {/* State badge overlay */}
      <div style={{ position: 'absolute', top: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0, 243, 255, 0.3)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: state === 'listening' ? '#10b981' : state === 'thinking' ? '#a855f7' : state === 'speaking' ? '#00f3ff' : '#00adb5' 
        }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.12em', color: '#00f3ff' }}>
          CORE: {state.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

export default ParticleAvatar;
