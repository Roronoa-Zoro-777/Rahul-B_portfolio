"use client";

import { useEffect, useRef } from "react";

interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  size: number;
  points: [number, number][];
  life: number; // 1.0 -> 0.0
  decay: number;
  hueOffset: number;
}

interface Crack {
  originX: number;
  originY: number;
  branches: [number, number][][];
  life: number;
}

export function GlassShatterEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shardsRef = useRef<Shard[]>([]);
  const cracksRef = useRef<Crack[]>([]);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    // Procedural synthesized glass clink / fracture acoustic
    const playGlassShatterSound = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
        const now = audioCtx.currentTime;

        // High crystal glass shatter chime (3200Hz -> 1400Hz)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(3400 + Math.random() * 600, now);
        osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.12);

        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // Secondary tinkling glass shard resonance
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(4800 + Math.random() * 800, now + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.16);

        gain2.gain.setValueAtTime(0.18, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.02);
        osc2.stop(now + 0.19);
      } catch {
        // Fallback
      }
    };

    const spawnShatter = (clickX: number, clickY: number) => {
      playGlassShatterSound();

      // 1. Generate radial impact crack branches
      const branchCount = 7 + Math.floor(Math.random() * 5);
      const branches: [number, number][][] = [];

      for (let b = 0; b < branchCount; b++) {
        const branch: [number, number][] = [[clickX, clickY]];
        const baseAngle = (b / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        let segX = clickX;
        let segY = clickY;
        const totalSegs = 3 + Math.floor(Math.random() * 4);
        let dist = 12 + Math.random() * 15;

        for (let s = 0; s < totalSegs; s++) {
          const segAngle = baseAngle + (Math.random() - 0.5) * 0.5;
          segX += Math.cos(segAngle) * dist;
          segY += Math.sin(segAngle) * dist;
          branch.push([segX, segY]);
          dist += 14 + Math.random() * 16;
        }
        branches.push(branch);
      }

      cracksRef.current.push({
        originX: clickX,
        originY: clickY,
        branches,
        life: 1.0,
      });

      // 2. Generate liquid glass shards that burst, tumble, and liquefy
      const shardCount = 24 + Math.floor(Math.random() * 12); // 24 to 36 shards

      for (let i = 0; i < shardCount; i++) {
        const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const speed = 140 + Math.random() * 320; // Explosion velocity (px/sec)
        const size = 12 + Math.random() * 26; // Shard size in pixels

        // Generate irregular polygonal glass shard vertices
        const vertCount = 3 + Math.floor(Math.random() * 3); // 3 to 5 vertices
        const points: [number, number][] = [];
        for (let v = 0; v < vertCount; v++) {
          const vAngle = (v / vertCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
          const r = size * (0.5 + Math.random() * 0.6);
          points.push([Math.cos(vAngle) * r, Math.sin(vAngle) * r]);
        }

        shardsRef.current.push({
          x: clickX + (Math.random() - 0.5) * 16,
          y: clickY + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (60 + Math.random() * 120), // Initial upward burst
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 14,
          size,
          points,
          life: 1.0,
          decay: 0.016 / (0.85 + Math.random() * 0.45), // ~0.85s to 1.3s lifespan
          hueOffset: Math.random(),
        });
      }

      // Start animation loop if not already running
      if (!rafIdRef.current) {
        lastTime = performance.now();
        rafIdRef.current = requestAnimationFrame(renderLoop);
      }
    };

    let lastTime = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // --- Draw & Fade Cracks ---
      for (let c = cracksRef.current.length - 1; c >= 0; c--) {
        const crack = cracksRef.current[c];
        crack.life -= dt * 2.8; // Fades within ~350ms

        if (crack.life <= 0) {
          cracksRef.current.splice(c, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${crack.life * 0.8})`;
        ctx.shadowColor = "rgba(212, 162, 47, 0.6)";
        ctx.shadowBlur = 6 * crack.life;
        ctx.lineWidth = 1.2 * crack.life;

        for (const branch of crack.branches) {
          ctx.beginPath();
          ctx.moveTo(branch[0][0], branch[0][1]);
          for (let p = 1; p < branch.length; p++) {
            ctx.lineTo(branch[p][0], branch[p][1]);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- Draw & Animate Liquid Glass Shards ---
      const gravity = 820; // px/sec² downward acceleration

      for (let s = shardsRef.current.length - 1; s >= 0; s--) {
        const shard = shardsRef.current[s];

        // Physics update
        shard.x += shard.vx * dt;
        shard.y += shard.vy * dt;
        shard.vy += gravity * dt;
        shard.vx *= 0.985; // Air drag
        shard.rot += shard.vRot * dt;
        shard.life -= shard.decay;

        if (shard.life <= 0 || shard.y > window.innerHeight + 100) {
          shardsRef.current.splice(s, 1);
          continue;
        }

        ctx.save();
        ctx.translate(shard.x, shard.y);
        ctx.rotate(shard.rot);

        // Liquid glass melting stretch effect when life drops
        if (shard.life < 0.5) {
          const melt = 1 + (0.5 - shard.life) * 1.8;
          ctx.scale(1 / melt, melt);
        }

        const alpha = Math.max(0, Math.min(1, shard.life * 1.2));

        // Refractive liquid glass gradient fill
        const grad = ctx.createLinearGradient(
          -shard.size,
          -shard.size,
          shard.size,
          shard.size
        );

        if (shard.hueOffset > 0.6) {
          // Titanium-gold tinted shard
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.75})`);
          grad.addColorStop(0.4, `rgba(212, 162, 47, ${alpha * 0.45})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.12})`);
        } else {
          // Pure icy crystal glass shard
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.85})`);
          grad.addColorStop(0.5, `rgba(180, 225, 255, ${alpha * 0.35})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.1})`);
        }

        ctx.fillStyle = grad;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = `rgba(212, 162, 47, ${alpha * 0.5})`;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(shard.points[0][0], shard.points[0][1]);
        for (let p = 1; p < shard.points.length; p++) {
          ctx.lineTo(shard.points[p][0], shard.points[p][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shimmer specular gleam on shard facet
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.lineWidth = 1.5;
        ctx.moveTo(shard.points[0][0] * 0.6, shard.points[0][1] * 0.6);
        ctx.lineTo(shard.points[1][0] * 0.6, shard.points[1][1] * 0.6);
        ctx.stroke();

        ctx.restore();
      }

      // Keep running if there are active shards or cracks
      if (shardsRef.current.length > 0 || cracksRef.current.length > 0) {
        rafIdRef.current = requestAnimationFrame(renderLoop);
      } else {
        rafIdRef.current = null;
      }
    };

    // Right-click listener
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent standard browser context menu
      spawnShatter(e.clientX, e.clientY);
    };

    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("contextmenu", handleContextMenu);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999] h-full w-full"
      aria-hidden="true"
    />
  );
}
