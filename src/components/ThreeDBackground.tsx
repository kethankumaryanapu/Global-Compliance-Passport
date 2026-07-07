'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/AppContext';

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  color: string;
  glowColor: string;
  size: number;
  pulseSpeed: number;
  pulseOffset: number;
  type: 'outer' | 'core';
}

interface Connection {
  p1: number;
  p2: number;
  distance: number;
}

interface DataPacket {
  fromNode: number;
  toNode: number;
  progress: number; // 0 to 1
  speed: number;
  size: number;
  color: string;
}

export default function ThreeDBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false });
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rect = canvas.getBoundingClientRect();
    let width = (canvas.width = rect.width);
    let height = (canvas.height = rect.height);

    // 3D parameters
    const focalLength = 500;
    let globeRadius = Math.min(width, height) * 0.28;
    let centerX = width / 2;
    let centerY = height / 2;

    // Rotation angles and speed variables
    let angleY = 0.002;
    let angleX = 0.001;
    let baseRotationSpeedY = 0.002;
    let baseRotationSpeedX = 0.001;
    let pulseTime = 0;

    // Color definitions
    // Theme-dependent glowing neon colors
    const colorsLight = [
      'rgba(99, 102, 241, ',   // Indigo
      'rgba(236, 72, 153, ',   // Pink/Magenta
      'rgba(6, 182, 212, ',    // Cyan
      'rgba(168, 85, 247, ',   // Purple
    ];
    const colorsDark = [
      'rgba(99, 102, 241, ',   // Indigo
      'rgba(236, 72, 153, ',   // Pink/Magenta
      'rgba(34, 211, 238, ',   // Cyan
      'rgba(192, 132, 252, ',  // Purple
    ];

    const getColors = () => (theme === 'light' ? colorsLight : colorsDark);

    const particles: Particle[] = [];
    
    // Outer Sphere (Network Mesh)
    const outerCount = 100;
    for (let i = 0; i < outerCount; i++) {
      const theta = Math.acos(-1 + (2 * i) / outerCount);
      const phi = Math.sqrt(outerCount * Math.PI) * theta;

      const x = globeRadius * Math.sin(theta) * Math.cos(phi);
      const y = globeRadius * Math.sin(theta) * Math.sin(phi);
      const z = globeRadius * Math.cos(theta);

      const colorPalette = getColors();
      const color = colorPalette[i % colorPalette.length];

      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        color,
        glowColor: color.replace('rgba(', '').split(',')[0] + ',' + color.replace('rgba(', '').split(',')[1] + ',' + color.replace('rgba(', '').split(',')[2],
        size: Math.random() * 2 + 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2,
        type: 'outer',
      });
    }

    // Inner Sphere (Core/Identity Engine)
    const coreCount = 45;
    const coreRadius = globeRadius * 0.42;
    for (let i = 0; i < coreCount; i++) {
      const theta = Math.acos(-1 + (2 * i) / coreCount);
      const phi = Math.sqrt(coreCount * Math.PI) * theta;

      const x = coreRadius * Math.sin(theta) * Math.cos(phi);
      const y = coreRadius * Math.sin(theta) * Math.sin(phi);
      const z = coreRadius * Math.cos(theta);

      // Core uses more vibrant warm tones (Magenta/Purple/Amber)
      const colorPalette = getColors();
      const color = colorPalette[(i + 1) % colorPalette.length]; // offset

      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        color,
        glowColor: color.replace('rgba(', '').split(',')[0] + ',' + color.replace('rgba(', '').split(',')[1] + ',' + color.replace('rgba(', '').split(',')[2],
        size: Math.random() * 1.5 + 1.2,
        pulseSpeed: 0.05 + Math.random() * 0.05,
        pulseOffset: Math.random() * Math.PI * 2,
        type: 'core',
      });
    }

    // High-tech static connection mappings (only outer sphere)
    const connections: Connection[] = [];
    const connectionMaxDist = globeRadius * 0.72;

    const computeInitialConnections = () => {
      connections.length = 0;
      for (let i = 0; i < outerCount; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < outerCount; j++) {
          const p2 = particles[j];

          const dx = p1.baseX - p2.baseX;
          const dy = p1.baseY - p2.baseY;
          const dz = p1.baseZ - p2.baseZ;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectionMaxDist) {
            connections.push({ p1: i, p2: j, distance: dist });
          }
        }
      }
    };
    computeInitialConnections();

    // Data packets flowing through connections
    const packets: DataPacket[] = [];
    const maxPackets = 12;

    const spawnPacket = () => {
      if (connections.length === 0 || packets.length >= maxPackets) return;
      const conn = connections[Math.floor(Math.random() * connections.length)];
      
      const palette = getColors();
      const randomColor = palette[Math.floor(Math.random() * palette.length)];

      packets.push({
        fromNode: conn.p1,
        toNode: conn.p2,
        progress: 0,
        speed: 0.008 + Math.random() * 0.015,
        size: Math.random() * 2 + 2.5,
        color: randomColor,
      });
    };

    // Ambient background stars
    const starCount = 50;
    const stars: { x: number; y: number; z: number; size: number; speedZ: number; color: string }[] = [];
    for (let i = 0; i < starCount; i++) {
      const palette = getColors();
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 1000 - 500,
        size: Math.random() * 1.2 + 0.6,
        speedZ: -(Math.random() * 0.3 + 0.1),
        color: palette[i % palette.length],
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      width = canvas.width = r.width;
      height = canvas.height = r.height;
      globeRadius = Math.min(width, height) * 0.28;
      centerX = width / 2;
      centerY = height / 2;
      computeInitialConnections();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      // Mouse coordinates relative to center of canvas
      mouseRef.current.targetX = (e.clientX - canvasRect.left - width / 2);
      mouseRef.current.targetY = (e.clientY - canvasRect.top - height / 2);
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      pulseTime += 0.01;

      // Lerp mouse coordinates
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Dynamic rotation based on mouse
      const rotationFactorY = mouseRef.current.active ? 0.0001 : 0;
      const rotationFactorX = mouseRef.current.active ? 0.0001 : 0;
      
      const currentAngleY = angleY + mouseRef.current.x * rotationFactorY;
      const currentAngleX = angleX + mouseRef.current.y * rotationFactorX;

      const cosY = Math.cos(currentAngleY);
      const sinY = Math.sin(currentAngleY);
      const cosX = Math.cos(currentAngleX);
      const sinX = Math.sin(currentAngleX);

      // Rotate all particles (both outer & core)
      particles.forEach((p) => {
        // Core rotates opposite direction for parallax depth
        const rotCosY = p.type === 'core' ? Math.cos(-currentAngleY * 1.5) : cosY;
        const rotSinY = p.type === 'core' ? Math.sin(-currentAngleY * 1.5) : sinY;
        const rotCosX = p.type === 'core' ? Math.cos(-currentAngleX * 1.5) : cosX;
        const rotSinX = p.type === 'core' ? Math.sin(-currentAngleX * 1.5) : sinX;

        // Rotate Y
        let x1 = p.x * rotCosY - p.z * rotSinY;
        let z1 = p.x * rotSinY + p.z * rotCosY;

        // Rotate X
        let y1 = p.y * rotCosX - z1 * rotSinX;
        let z2 = p.y * rotSinX + z1 * rotCosX;

        p.x = x1;
        p.y = y1;
        p.z = z2;
      });

      // Periodic packet spawning
      if (Math.random() < 0.06) {
        spawnPacket();
      }

      // Update packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          packets.splice(i, 1);
        }
      }

      // Project ambient stars
      stars.forEach((star) => {
        star.z += star.speedZ;
        if (star.z < -focalLength) {
          star.z = 800;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const scale = focalLength / (focalLength + star.z);
        const starX = centerX + star.x * scale;
        const starY = centerY + star.y * scale;

        if (starX >= 0 && starX <= width && starY >= 0 && starY <= height) {
          const depthOpacity = Math.max(0.05, Math.min(0.35, scale)) * (theme === 'light' ? 0.6 : 1);
          ctx.beginPath();
          ctx.arc(starX, starY, star.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = `${star.color.replace('rgba(', '').split(',')[0]}, ${star.color.replace('rgba(', '').split(',')[1]}, ${star.color.replace('rgba(', '').split(',')[2]}, ${depthOpacity})`;
          ctx.fill();
        }
      });

      // 1. Draw glowing background radial light source in canvas to highlight sphere (Theme dependent)
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        globeRadius * 1.8
      );
      if (theme === 'light') {
        auraGradient.addColorStop(0, 'rgba(224, 231, 255, 0.65)'); // soft light indigo glow
        auraGradient.addColorStop(0.4, 'rgba(243, 244, 246, 0.3)');
        auraGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        auraGradient.addColorStop(0, 'rgba(99, 102, 241, 0.08)');  // deep tech indigo glow
        auraGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Project particles to 2D screen coordinates
      const projected = particles.map((p, idx) => {
        let finalX = p.x;
        let finalY = p.y;
        let finalZ = p.z;

        // Interactive mouse gravity deflection
        if (mouseRef.current.active) {
          const dx = finalX - mouseRef.current.x;
          const dy = finalY - mouseRef.current.y;
          const dist2D = Math.sqrt(dx * dx + dy * dy);
          
          if (dist2D < 120) {
            const force = (120 - dist2D) / 120;
            // Push outwards gently or warp coordinates
            finalX += (dx / dist2D) * force * 15;
            finalY += (dy / dist2D) * force * 15;
          }
        }

        const scale = focalLength / (focalLength + finalZ + globeRadius * 1.4);
        const sx = centerX + finalX * scale * 1.8;
        const sy = centerY + finalY * scale * 1.8;

        return {
          idx,
          sx,
          sy,
          sz: finalZ,
          scale,
          color: p.color,
          glowColor: p.glowColor,
          size: p.size,
          type: p.type,
          pulseOffset: p.pulseOffset,
          pulseSpeed: p.pulseSpeed,
        };
      });

      // 2. Draw Connection lines (depth based)
      ctx.lineWidth = theme === 'light' ? 0.6 : 0.45;
      
      connections.forEach((conn) => {
        const p1 = projected[conn.p1];
        const p2 = projected[conn.p2];

        // Only draw lines on screen bounds
        if (
          p1.sx < 0 || p1.sx > width || p1.sy < 0 || p1.sy > height ||
          p2.sx < 0 || p2.sx > width || p2.sy < 0 || p2.sy > height
        ) {
          return;
        }

        // Depth opacity: fade lines in the back
        const avgZ = (p1.sz + p2.sz) / 2;
        const scale = (p1.scale + p2.scale) / 2;
        let lineOpacity = (1 - conn.distance / connectionMaxDist) * 0.22 * Math.min(p1.scale, p2.scale);
        
        // Boost line transparency slightly in light mode for visibility
        if (theme === 'light') lineOpacity *= 1.35;

        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);

        const grad = ctx.createLinearGradient(p1.sx, p1.sy, p2.sx, p2.sy);
        grad.addColorStop(0, `rgba(${p1.glowColor}, ${lineOpacity})`);
        grad.addColorStop(1, `rgba(${p2.glowColor}, ${lineOpacity})`);

        ctx.strokeStyle = grad;
        ctx.stroke();
      });

      // 3. Draw flowing data packets
      packets.forEach((pack) => {
        const p1 = projected[pack.fromNode];
        const p2 = projected[pack.toNode];

        // Lerp position
        const px = p1.sx + (p2.sx - p1.sx) * pack.progress;
        const py = p1.sy + (p2.sy - p1.sy) * pack.progress;
        const pz = p1.sz + (p2.sz - p1.sz) * pack.progress;
        const scale = p1.scale + (p2.scale - p1.scale) * pack.progress;

        const packetOpacity = Math.max(0.2, (pz + globeRadius) / (globeRadius * 2)) * (theme === 'light' ? 0.95 : 0.85);

        ctx.beginPath();
        ctx.arc(px, py, pack.size * scale * 1.5, 0, Math.PI * 2);
        
        // Neon glow for packets
        ctx.shadowBlur = theme === 'light' ? 6 : 10;
        ctx.shadowColor = pack.color + '0.9)';
        ctx.fillStyle = pack.color + packetOpacity + ')';
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // 4. Sort projected nodes by depth (back to front)
      projected.sort((a, b) => b.sz - a.sz);

      // Draw nodes
      projected.forEach((item) => {
        const pulse = Math.sin(pulseTime * 2.5 + item.pulseOffset) * 0.15 + 0.85;
        const scale = item.scale * pulse;
        const baseOpacity = item.type === 'core' ? 0.9 : 0.7;
        const opacity = Math.min(1.0, Math.max(0.2, (item.sz + globeRadius) / (globeRadius * 2))) * baseOpacity;

        // Core elements are drawn slightly brighter with more glow
        ctx.beginPath();
        if (item.type === 'core') {
          ctx.arc(item.sx, item.sy, item.size * scale * 1.9, 0, Math.PI * 2);
          ctx.shadowBlur = theme === 'light' ? 8 : 12;
          ctx.shadowColor = `rgba(${item.glowColor}, 0.95)`;
          ctx.fillStyle = `rgba(${item.glowColor}, ${opacity})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.arc(item.sx, item.sy, item.size * scale * 1.7, 0, Math.PI * 2);
          
          // Outer nodes only glow if front facing or near mouse
          const distToMouse = mouseRef.current.active
            ? Math.sqrt(Math.pow(item.sx - (centerX + mouseRef.current.x), 2) + Math.pow(item.sy - (centerY + mouseRef.current.y), 2))
            : 999;

          if (item.sz < 0 || distToMouse < 80) {
            ctx.shadowBlur = distToMouse < 80 ? 12 : 7;
            ctx.shadowColor = `rgba(${item.glowColor}, 0.8)`;
          }
          
          ctx.fillStyle = `rgba(${item.glowColor}, ${opacity})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 5. Draw futuristic nested security guard rings (horizontal & vertical)
      const drawRing = (rotX: number, rotY: number, sizeMult: number, colorStr: string, speedMult: number) => {
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = theme === 'light' ? 1.5 : 1.25;
        ctx.setLineDash([6, 15]); // futuristic dashed style
        
        ctx.beginPath();
        const t = Date.now() * 0.0005 * speedMult;
        ctx.ellipse(
          centerX,
          centerY,
          globeRadius * sizeMult,
          globeRadius * sizeMult * Math.abs(Math.sin(rotX)),
          t,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.setLineDash([]); // reset
      };

      // Draw two offset high-tech security orbits (colors adjusted for theme)
      if (theme === 'light') {
        drawRing(0.65, 0.2, 1.6, 'rgba(99, 102, 241, 0.25)', 0.85); // Indigo Outer
        drawRing(-0.45, -0.15, 1.45, 'rgba(236, 72, 153, 0.22)', -1.1); // Pink Inner
      } else {
        drawRing(0.65, 0.2, 1.6, 'rgba(99, 102, 241, 0.18)', 0.85); // Indigo Outer
        drawRing(-0.45, -0.15, 1.45, 'rgba(236, 72, 153, 0.15)', -1.1); // Pink Inner
      }

      // 6. Scanning Radar sweep effect (Theme customized)
      const scanY = centerY + Math.sin(Date.now() * 0.001) * globeRadius * 1.5;
      if (scanY > centerY - globeRadius * 1.5 && scanY < centerY + globeRadius * 1.5) {
        const scanWidth = Math.sqrt(Math.max(0, globeRadius * globeRadius * 2.25 - Math.pow(scanY - centerY, 2)));
        const grad = ctx.createLinearGradient(centerX - scanWidth, scanY, centerX + scanWidth, scanY);
        
        if (theme === 'light') {
          grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
          grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)'); // brighter cyan scan in light mode
          grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.lineWidth = 2.0;
        } else {
          grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
          grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.12)'); // standard cyan scan in dark mode
          grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.lineWidth = 1.5;
        }

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(centerX - scanWidth, scanY);
        ctx.lineTo(centerX + scanWidth, scanY);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]); // Re-run effect if theme changes to load correct palettes

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 block bg-transparent"
      style={{ 
        mixBlendMode: theme === 'light' ? 'normal' : 'screen',
        opacity: theme === 'light' ? 0.95 : 0.85
      }}
    />
  );
}
