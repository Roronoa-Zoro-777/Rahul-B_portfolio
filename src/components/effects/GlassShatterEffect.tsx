"use client";

import { useEffect, useRef } from "react";

interface CrackSegment {
  points: { x: number; y: number }[];
}

interface ImpactCrack {
  x: number;
  y: number;
  life: number;
  duration: number;
  flashLife: number;
  segments: CrackSegment[];
  rings: { points: { x: number; y: number }[] }[];
}

interface LiquidDroplet {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

interface GlassShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  flip: number;
  vFlip: number;
  size: number;
  vertices: { x: number; y: number }[];
  colorType: "ice" | "gold";
  life: number;
  duration: number;
  trailTimer: number;
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  duration: number;
  color: string;
}

export function GlassShatterEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shardsRef = useRef<GlassShard[]>([]);
  const cracksRef = useRef<ImpactCrack[]>([]);
  const dropletsRef = useRef<LiquidDroplet[]>([]);
  const sparklesRef = useRef<Sparkle[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastTriggerTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    // Generate irregular glass shard polygon vertices
    const generateShardPolygon = (radius: number): { x: number; y: number }[] => {
      const sides = 3 + Math.floor(Math.random() * 3); // 3 to 5 sides
      const points: { x: number; y: number }[] = [];
      const angleStep = (Math.PI * 2) / sides;

      for (let i = 0; i < sides; i++) {
        const angle = i * angleStep + (Math.random() - 0.5) * (angleStep * 0.7);
        // Vary radii to create sharp, jagged crystalline shards
        const r = radius * (0.45 + Math.random() * 0.75);
        points.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
        });
      }
      return points;
    };

    // Spawn central bullet / hammer shatter fracture web
    const triggerImpactWeb = (cx: number, cy: number) => {
      const rays = 10 + Math.floor(Math.random() * 4); // 10 to 14 fracture rays
      const segments: CrackSegment[] = [];

      for (let r = 0; r < rays; r++) {
        const baseAngle = (r / rays) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const pts: { x: number; y: number }[] = [{ x: cx, y: cy }];
        let currX = cx;
        let currY = cy;
        const subSegments = 3 + Math.floor(Math.random() * 3);
        let dist = 18;

        for (let s = 0; s < subSegments; s++) {
          const angle = baseAngle + (Math.random() - 0.5) * 0.45;
          currX += Math.cos(angle) * dist;
          currY += Math.sin(angle) * dist;
          pts.push({ x: currX, y: currY });
          dist += 14 + Math.random() * 16;
        }
        segments.push({ points: pts });
      }

      // Concentric fracture stress rings
      const rings: { points: { x: number; y: number }[] }[] = [];
      const ringRadii = [22, 42, 68];
      for (const baseR of ringRadii) {
        const ringPts: { x: number; y: number }[] = [];
        const numPts = 10;
        for (let p = 0; p <= numPts; p++) {
          const angle = (p / numPts) * Math.PI * 2;
          const r = baseR + (Math.random() - 0.5) * 10;
          ringPts.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
          });
        }
        rings.push({ points: ringPts });
      }

      cracksRef.current.push({
        x: cx,
        y: cy,
        life: 0.5,
        duration: 0.5,
        flashLife: 0.16,
        segments,
        rings,
      });
    };

    // Master trigger: creates visible shards, liquid drops, and sparks
    const triggerGlassShatter = (x: number, y: number) => {
      const now = performance.now();
      // 35ms debounce prevents duplicate events from pointerdown + mousedown
      if (now - lastTriggerTimeRef.current < 35) return;
      lastTriggerTimeRef.current = now;

      // 1. Central spiderweb fracture
      triggerImpactWeb(x, y);

      // 2. High-visibility chunky glass shards
      const shardCount = 24 + Math.floor(Math.random() * 8); // 24 to 32 shards
      for (let i = 0; i < shardCount; i++) {
        // Chunky size: 22px to 52px radius (up to 104px across) so it is vividly visible
        const size = 22 + Math.random() * 30;
        const vertices = generateShardPolygon(size);

        // Explosive 360-degree radial blast
        const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
        const speed = 200 + Math.random() * 420; // px/sec
        const upwardPop = 140 + Math.random() * 260; // Initial upward kinetic pop

        shardsRef.current.push({
          x: x + (Math.random() - 0.5) * 16,
          y: y + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - upwardPop,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 10,
          flip: Math.random() * Math.PI * 2,
          vFlip: (Math.random() - 0.5) * 8,
          size,
          vertices,
          colorType: Math.random() > 0.45 ? "gold" : "ice",
          life: 1.0,
          duration: 0.9 + Math.random() * 0.45, // 0.9s to 1.35s
          trailTimer: 0,
        });
      }

      // 3. Fast radiant diamond glass sparkles
      const sparkleCount = 16 + Math.floor(Math.random() * 8);
      for (let s = 0; s < sparkleCount; s++) {
        const sAngle = Math.random() * Math.PI * 2;
        const sSpeed = 260 + Math.random() * 480;
        sparklesRef.current.push({
          x,
          y,
          vx: Math.cos(sAngle) * sSpeed,
          vy: Math.sin(sAngle) * sSpeed - (80 + Math.random() * 160),
          size: 2.5 + Math.random() * 3.5,
          life: 1.0,
          duration: 0.35 + Math.random() * 0.35,
          color: Math.random() > 0.4 ? "#ffffff" : "#f5c850",
        });
      }

      // Start physics animation loop
      if (!rafIdRef.current) {
        lastTimeRef.current = performance.now();
        rafIdRef.current = requestAnimationFrame(animateLoop);
      }
    };

    // Physics Animation Loop
    const animateLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.08);
      lastTimeRef.current = currentTime;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const gravity = 1050; // px/sec² downward acceleration

      // 1. Render & Update Central Impact Fractures
      for (let c = cracksRef.current.length - 1; c >= 0; c--) {
        const crack = cracksRef.current[c];
        crack.life -= dt;
        crack.flashLife -= dt;

        if (crack.life <= 0) {
          cracksRef.current.splice(c, 1);
          continue;
        }

        const alpha = Math.max(0, crack.life / crack.duration);

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Radial Flash at point of impact
        if (crack.flashLife > 0) {
          const flashProgress = 1 - crack.flashLife / 0.16;
          const flashRadius = 24 + flashProgress * 48;
          const flashAlpha = (1 - flashProgress) * 0.9;
          const grad = ctx.createRadialGradient(
            crack.x,
            crack.y,
            0,
            crack.x,
            crack.y,
            flashRadius
          );
          grad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
          grad.addColorStop(0.4, `rgba(212, 162, 47, ${flashAlpha * 0.7})`);
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(crack.x, crack.y, flashRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw spiderweb fracture lines
        ctx.shadowColor = "rgba(212, 162, 47, 0.9)";
        ctx.shadowBlur = 10;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.lineWidth = 2.2;

        for (const seg of crack.segments) {
          if (seg.points.length < 2) continue;
          ctx.beginPath();
          ctx.moveTo(seg.points[0].x, seg.points[0].y);
          for (let p = 1; p < seg.points.length; p++) {
            ctx.lineTo(seg.points[p].x, seg.points[p].y);
          }
          ctx.stroke();
        }

        // Draw stress rings
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
        ctx.lineWidth = 1.6;
        for (const ring of crack.rings) {
          if (ring.points.length < 2) continue;
          ctx.beginPath();
          ctx.moveTo(ring.points[0].x, ring.points[0].y);
          for (let p = 1; p < ring.points.length; p++) {
            ctx.lineTo(ring.points[p].x, ring.points[p].y);
          }
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
      }

      // 2. Render & Update Molten Liquid Droplets
      for (let d = dropletsRef.current.length - 1; d >= 0; d--) {
        const drop = dropletsRef.current[d];
        drop.alpha -= dt * 1.8;
        drop.r = Math.max(0.5, drop.r - dt * 2);

        if (drop.alpha <= 0 || drop.r <= 0.5) {
          dropletsRef.current.splice(d, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${drop.alpha * 0.9})`;
        ctx.shadowColor = "rgba(212, 162, 47, 0.85)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      // 3. Render & Update Chunky Liquid Glass Shards
      const shards = shardsRef.current;
      for (let s = shards.length - 1; s >= 0; s--) {
        const shard = shards[s];

        // Kinematics
        shard.x += shard.vx * dt;
        shard.y += shard.vy * dt;
        shard.vy += gravity * dt;
        shard.vx *= 0.988; // Air drag

        // 3D Tumbling
        shard.rot += shard.vRot * dt;
        shard.flip += shard.vFlip * dt;

        // Life decay
        shard.life -= dt / shard.duration;

        // Spawn molten liquid glass droplet trail when melting
        shard.trailTimer += dt;
        if (shard.trailTimer > 0.04 && shard.life < 0.7) {
          shard.trailTimer = 0;
          dropletsRef.current.push({
            x: shard.x + (Math.random() - 0.5) * (shard.size * 0.5),
            y: shard.y + (Math.random() - 0.5) * (shard.size * 0.5),
            r: 2 + Math.random() * 3.5,
            alpha: Math.min(1, shard.life * 1.4),
          });
        }

        // Cleanup expired or offscreen shards
        if (shard.life <= 0 || shard.y > window.innerHeight + 120) {
          shards.splice(s, 1);
          continue;
        }

        // Liquid glass deformation (elongation into flowing liquid droplets as they fall)
        const progress = 1 - Math.max(0, shard.life);
        let stretchY = 1;
        let stretchX = 1;
        if (progress > 0.35) {
          const meltFactor = (progress - 0.35) / 0.65;
          stretchY = 1 + meltFactor * 2.1; // Molten vertical teardrop elongation
          stretchX = Math.max(0.25, 1 - meltFactor * 0.65);
        }

        // Smooth fade out
        const alpha = Math.max(0, Math.min(1, shard.life * 1.6));

        ctx.save();
        ctx.translate(shard.x, shard.y);
        ctx.rotate(shard.rot);

        // 3D perspective flip and molten stretch
        const flipScale = Math.cos(shard.flip);
        ctx.scale(stretchX * (Math.abs(flipScale) < 0.15 ? 0.15 : flipScale), stretchY);

        // Build shard polygon path
        ctx.beginPath();
        ctx.moveTo(shard.vertices[0].x, shard.vertices[0].y);
        for (let i = 1; i < shard.vertices.length; i++) {
          ctx.lineTo(shard.vertices[i].x, shard.vertices[i].y);
        }
        ctx.closePath();

        // Refractive Gradient Fill (Titanium Gold vs Ice Crystal)
        const grad = ctx.createLinearGradient(
          -shard.size,
          -shard.size,
          shard.size,
          shard.size
        );

        if (shard.colorType === "gold") {
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
          grad.addColorStop(0.35, `rgba(250, 215, 90, ${alpha * 0.75})`);
          grad.addColorStop(0.7, `rgba(212, 162, 47, ${alpha * 0.5})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.28})`);
        } else {
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.98})`);
          grad.addColorStop(0.4, `rgba(185, 230, 255, ${alpha * 0.75})`);
          grad.addColorStop(0.75, `rgba(140, 205, 255, ${alpha * 0.45})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.3})`);
        }

        ctx.fillStyle = grad;
        ctx.shadowColor =
          shard.colorType === "gold"
            ? "rgba(212, 162, 47, 0.95)"
            : "rgba(255, 255, 255, 0.95)";
        ctx.shadowBlur = 12;
        ctx.fill();

        // Glowing specular outer border along EVERY edge
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.98})`;
        ctx.lineWidth = 2.6;
        ctx.lineJoin = "miter";
        ctx.stroke();

        // Internal facet reflection glint line
        if (shard.vertices.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(shard.vertices[0].x * 0.55, shard.vertices[0].y * 0.55);
          ctx.lineTo(shard.vertices[1].x * 0.55, shard.vertices[1].y * 0.55);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }

        ctx.restore();
      }

      // 4. Render & Update Sparkling Diamond Shards
      const sparkles = sparklesRef.current;
      for (let sp = sparkles.length - 1; sp >= 0; sp--) {
        const p = sparkles[sp];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += gravity * 0.65 * dt;
        p.life -= dt / p.duration;

        if (p.life <= 0) {
          sparkles.splice(sp, 1);
          continue;
        }

        const pAlpha = Math.max(0, p.life);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = pAlpha;

        // 4-pointed diamond star
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(0, -s * 1.8);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s * 1.8);
        ctx.lineTo(-s * 0.6, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Continue animation loop if items are active, or halt to save battery
      const hasActiveElements =
        shardsRef.current.length > 0 ||
        cracksRef.current.length > 0 ||
        dropletsRef.current.length > 0 ||
        sparklesRef.current.length > 0;

      if (hasActiveElements) {
        rafIdRef.current = requestAnimationFrame(animateLoop);
      } else {
        rafIdRef.current = null;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
    };

    // Global Event Handlers: Capture phase ensures NO child element blocks triggers
    const handlePointerDown = (e: PointerEvent) => {
      triggerGlassShatter(e.clientX, e.clientY);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Intercept browser context menu so glass shatter is unobstructed
      triggerGlassShatter(e.clientX, e.clientY);
    };

    // Attach to window in CAPTURE phase so clicks everywhere trigger the effect
    window.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
      passive: true,
    });
    window.addEventListener("contextmenu", handleContextMenu, {
      capture: true,
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      window.removeEventListener("contextmenu", handleContextMenu, {
        capture: true,
      });
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="glass-shatter-canvas"
      className="pointer-events-none fixed inset-0 z-[999999] h-screen w-screen overflow-hidden"
      aria-hidden="true"
    />
  );
}

