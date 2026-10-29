"use client";

import { useEffect, useRef } from "react";

interface FractureRay {
  points: { x: number; y: number }[];
}

interface ImpactWeb {
  x: number;
  y: number;
  life: number;
  duration: number;
  rays: FractureRay[];
  rings: { points: { x: number; y: number }[] }[];
  flashAlpha: number;
}

interface GlassShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotZ: number;
  vRotZ: number;
  rotX: number;
  vRotX: number;
  rotY: number;
  vRotY: number;
  size: number;
  vertices: { x: number; y: number }[];
  internalFacet: { x1: number; y1: number; x2: number; y2: number };
  life: number;
  duration: number;
  shardType: "large" | "medium" | "sliver";
}

interface GlassSplinter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  duration: number;
  rot: number;
  vRot: number;
  color: string;
}

interface ReloadIndicator {
  x: number;
  y: number;
  time: number;
  duration: number;
}

export function GlassShatterEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shardsRef = useRef<GlassShard[]>([]);
  const websRef = useRef<ImpactWeb[]>([]);
  const splintersRef = useRef<GlassSplinter[]>([]);
  const reloadsRef = useRef<ReloadIndicator[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastTriggerTimeRef = useRef<number>(0);

  useEffect(() => {
    // Disable entirely on mobile to eliminate touch/pointermove listener lag and GPU overhead
    if (
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || window.matchMedia("(max-width: 768px)").matches)
    ) {
      return;
    }

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

    // Creates realistic angular glass shard geometry (sharp wedges, quads, and daggers)
    const createRealisticShard = (
      type: "large" | "medium" | "sliver",
      baseRadius: number
    ): {
      vertices: { x: number; y: number }[];
      facet: { x1: number; y1: number; x2: number; y2: number };
    } => {
      let vertices: { x: number; y: number }[] = [];

      if (type === "sliver") {
        // Needle-like glass sliver (sharp dagger)
        const length = baseRadius * (1.6 + Math.random() * 0.8);
        const halfWidth = (baseRadius * 0.28) + Math.random() * 4;
        vertices = [
          { x: 0, y: -length },
          { x: halfWidth, y: length * 0.4 },
          { x: halfWidth * 0.3, y: length },
          { x: -halfWidth * 0.6, y: length * 0.6 },
        ];
      } else if (type === "medium") {
        // Sharp triangular or trapezoidal wedge
        const isQuad = Math.random() > 0.45;
        if (isQuad) {
          vertices = [
            { x: -baseRadius * (0.6 + Math.random() * 0.4), y: -baseRadius * (0.8 + Math.random() * 0.4) },
            { x: baseRadius * (0.7 + Math.random() * 0.5), y: -baseRadius * (0.3 + Math.random() * 0.3) },
            { x: baseRadius * (0.5 + Math.random() * 0.4), y: baseRadius * (0.8 + Math.random() * 0.4) },
            { x: -baseRadius * (0.8 + Math.random() * 0.3), y: baseRadius * (0.5 + Math.random() * 0.3) },
          ];
        } else {
          // Sharp scalene triangle
          const tipAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
          const a2 = tipAngle + (Math.PI * 0.7) + (Math.random() - 0.5) * 0.4;
          const a3 = tipAngle - (Math.PI * 0.7) + (Math.random() - 0.5) * 0.4;
          vertices = [
            { x: Math.cos(tipAngle) * baseRadius * 1.3, y: Math.sin(tipAngle) * baseRadius * 1.3 },
            { x: Math.cos(a2) * baseRadius * 0.85, y: Math.sin(a2) * baseRadius * 0.85 },
            { x: Math.cos(a3) * baseRadius * 0.95, y: Math.sin(a3) * baseRadius * 0.95 },
          ];
        }
      } else {
        // Large heavy impact pane chunk (irregular 4-5 sided plate fragment)
        const sides = 4 + (Math.random() > 0.5 ? 1 : 0);
        const angleStep = (Math.PI * 2) / sides;
        for (let i = 0; i < sides; i++) {
          const a = i * angleStep + (Math.random() - 0.5) * (angleStep * 0.6);
          const r = baseRadius * (0.6 + Math.random() * 0.6);
          vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }
      }

      // Internal facet reflection hairline (mimics refractive glass thickness)
      const facet = {
        x1: vertices[0].x * 0.65,
        y1: vertices[0].y * 0.65,
        x2: vertices[Math.floor(vertices.length / 2)].x * 0.65,
        y2: vertices[Math.floor(vertices.length / 2)].y * 0.65,
      };

      return { vertices, facet };
    };

    // Spawns video-game bullet impact spiderweb fracture
    const triggerImpactFracture = (cx: number, cy: number) => {
      const rayCount = 12 + Math.floor(Math.random() * 5); // 12-16 radial fracture rays
      const rays: FractureRay[] = [];

      for (let r = 0; r < rayCount; r++) {
        const baseAngle = (r / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const pts: { x: number; y: number }[] = [{ x: cx, y: cy }];
        let curX = cx;
        let curY = cy;
        const segments = 3 + Math.floor(Math.random() * 3);
        let dist = 14;

        for (let s = 0; s < segments; s++) {
          const a = baseAngle + (Math.random() - 0.5) * 0.4;
          curX += Math.cos(a) * dist;
          curY += Math.sin(a) * dist;
          pts.push({ x: curX, y: curY });
          dist += 12 + Math.random() * 18;
        }
        rays.push({ points: pts });
      }

      // Concentric fracture stress rings
      const rings: { points: { x: number; y: number }[] }[] = [];
      const ringRadii = [20, 42, 70];
      for (const baseR of ringRadii) {
        const ringPts: { x: number; y: number }[] = [];
        const numPts = 10;
        for (let p = 0; p <= numPts; p++) {
          const a = (p / numPts) * Math.PI * 2;
          const r = baseR + (Math.random() - 0.5) * 8;
          ringPts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
        rings.push({ points: ringPts });
      }

      websRef.current.push({
        x: cx,
        y: cy,
        life: 0.45,
        duration: 0.45,
        rays,
        rings,
        flashAlpha: 1.0,
      });
    };

    // Main shatter engine: creates realistic video game glass fragments & reload HUD
    const triggerVideoGameShatter = (x: number, y: number) => {
      const now = performance.now();
      // Debounce slightly to prevent double execution
      if (now - lastTriggerTimeRef.current < 35) return;
      lastTriggerTimeRef.current = now;

      // 1. Bullet hole spiderweb impact
      triggerImpactFracture(x, y);

      // 2. Realistic Fragment Hierarchy (Heavy Chunks, Medium Shards, Slivers)
      // a) Large heavy plate chunks (4-6 pieces)
      const largeCount = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < largeCount; i++) {
        const size = 32 + Math.random() * 22; // 32px to 54px
        const { vertices, facet } = createRealisticShard("large", size);
        const angle = (i / largeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const speed = 140 + Math.random() * 240; // Heavy pieces move slightly slower

        shardsRef.current.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 14,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (100 + Math.random() * 160), // Upward pop
          rotZ: Math.random() * Math.PI * 2,
          vRotZ: (Math.random() - 0.5) * 5,
          rotX: Math.random() * Math.PI * 2,
          vRotX: (Math.random() - 0.5) * 6,
          rotY: Math.random() * Math.PI * 2,
          vRotY: (Math.random() - 0.5) * 6,
          size,
          vertices,
          internalFacet: facet,
          life: 1.0,
          duration: 1.1 + Math.random() * 0.4,
          shardType: "large",
        });
      }

      // b) Medium razor shards (14-18 pieces)
      const medCount = 14 + Math.floor(Math.random() * 5);
      for (let i = 0; i < medCount; i++) {
        const size = 18 + Math.random() * 16; // 18px to 34px
        const { vertices, facet } = createRealisticShard("medium", size);
        const angle = (i / medCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const speed = 220 + Math.random() * 380;

        shardsRef.current.push({
          x: x + (Math.random() - 0.5) * 16,
          y: y + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (140 + Math.random() * 240),
          rotZ: Math.random() * Math.PI * 2,
          vRotZ: (Math.random() - 0.5) * 9,
          rotX: Math.random() * Math.PI * 2,
          vRotX: (Math.random() - 0.5) * 9,
          rotY: Math.random() * Math.PI * 2,
          vRotY: (Math.random() - 0.5) * 9,
          size,
          vertices,
          internalFacet: facet,
          life: 1.0,
          duration: 0.95 + Math.random() * 0.45,
          shardType: "medium",
        });
      }

      // c) Needle-like glass slivers (8-12 pieces)
      const sliverCount = 8 + Math.floor(Math.random() * 5);
      for (let i = 0; i < sliverCount; i++) {
        const size = 14 + Math.random() * 12;
        const { vertices, facet } = createRealisticShard("sliver", size);
        const angle = Math.random() * Math.PI * 2;
        const speed = 280 + Math.random() * 450;

        shardsRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (160 + Math.random() * 260),
          rotZ: Math.random() * Math.PI * 2,
          vRotZ: (Math.random() - 0.5) * 14,
          rotX: Math.random() * Math.PI * 2,
          vRotX: (Math.random() - 0.5) * 12,
          rotY: Math.random() * Math.PI * 2,
          vRotY: (Math.random() - 0.5) * 12,
          size,
          vertices,
          internalFacet: facet,
          life: 1.0,
          duration: 0.8 + Math.random() * 0.35,
          shardType: "sliver",
        });
      }

      // 3. Fast Pulverized Glass Splinters & Dust (Pure Ice / White / Diamond)
      const splinterCount = 22 + Math.floor(Math.random() * 10);
      for (let s = 0; s < splinterCount; s++) {
        const sAngle = Math.random() * Math.PI * 2;
        const sSpeed = 300 + Math.random() * 520;
        splintersRef.current.push({
          x,
          y,
          vx: Math.cos(sAngle) * sSpeed,
          vy: Math.sin(sAngle) * sSpeed - (100 + Math.random() * 220),
          size: 1.8 + Math.random() * 3.2,
          life: 1.0,
          duration: 0.4 + Math.random() * 0.35,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 20,
          color: Math.random() > 0.4 ? "#ffffff" : "#cceeff", // Cold diamond crystal only (no yellow)
        });
      }

      // 4. Tactical Video Game Reload Dial at Click Position
      reloadsRef.current.push({
        x,
        y,
        time: 0,
        duration: 0.52, // Snappy 0.52s realistic tactical chamber reload
      });

      // Kick off physics loop
      if (!rafIdRef.current) {
        lastTimeRef.current = performance.now();
        rafIdRef.current = requestAnimationFrame(animatePhysicsLoop);
      }
    };

    // Realistic Game Glass Physics Loop
    const animatePhysicsLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.08);
      lastTimeRef.current = currentTime;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Realistic downward gravity (1300 px/sec²)
      const gravity = 1300;

      // 1. Render Impact Spiderweb & Bullet Crater
      for (let w = websRef.current.length - 1; w >= 0; w--) {
        const web = websRef.current[w];
        web.life -= dt;
        web.flashAlpha = Math.max(0, web.flashAlpha - dt * 6.5);

        if (web.life <= 0) {
          websRef.current.splice(w, 1);
          continue;
        }

        const alpha = Math.max(0, web.life / web.duration);

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Bullet impact cold flash disc
        if (web.flashAlpha > 0) {
          const flashRadius = 26 + (1 - web.flashAlpha) * 44;
          const flashGrad = ctx.createRadialGradient(
            web.x,
            web.y,
            0,
            web.x,
            web.y,
            flashRadius
          );
          flashGrad.addColorStop(0, `rgba(255, 255, 255, ${web.flashAlpha * 0.95})`);
          flashGrad.addColorStop(0.4, `rgba(210, 240, 255, ${web.flashAlpha * 0.7})`);
          flashGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(web.x, web.y, flashRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Spiderweb fracture lines (Pure white with cold cyan frost glow)
        ctx.shadowColor = "rgba(200, 235, 255, 0.9)";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.96})`;
        ctx.lineWidth = 2.2;

        for (const ray of web.rays) {
          if (ray.points.length < 2) continue;
          ctx.beginPath();
          ctx.moveTo(ray.points[0].x, ray.points[0].y);
          for (let p = 1; p < ray.points.length; p++) {
            ctx.lineTo(ray.points[p].x, ray.points[p].y);
          }
          ctx.stroke();
        }

        // Stress rings
        ctx.strokeStyle = `rgba(215, 240, 255, ${alpha * 0.78})`;
        ctx.lineWidth = 1.6;
        for (const ring of web.rings) {
          if (ring.points.length < 2) continue;
          ctx.beginPath();
          ctx.moveTo(ring.points[0].x, ring.points[0].y);
          for (let p = 1; p < ring.points.length; p++) {
            ctx.lineTo(ring.points[p].x, ring.points[p].y);
          }
          ctx.closePath();
          ctx.stroke();
        }

        // Bullet penetration hole core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(web.x, web.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 2. Render Micro-Splinters & Powdered Glass Dust
      const splinters = splintersRef.current;
      for (let sp = splinters.length - 1; sp >= 0; sp--) {
        const p = splinters[sp];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += gravity * 0.65 * dt;
        p.vx *= 0.985;
        p.rot += p.vRot * dt;
        p.life -= dt / p.duration;

        if (p.life <= 0) {
          splinters.splice(sp, 1);
          continue;
        }

        const pAlpha = Math.max(0, p.life);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowColor = "rgba(220, 245, 255, 0.9)";
        ctx.shadowBlur = 6;
        ctx.globalAlpha = pAlpha;

        // Sharp triangular crystal sliver
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(0, -s * 1.6);
        ctx.lineTo(s * 0.6, s * 0.8);
        ctx.lineTo(-s * 0.6, s * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 3. Render Rigid Crystalline Glass Shards (Realistic 3D Tumbling & Light Glints)
      const shards = shardsRef.current;
      for (let s = shards.length - 1; s >= 0; s--) {
        const shard = shards[s];

        // Ballistic motion & air drag
        shard.x += shard.vx * dt;
        shard.y += shard.vy * dt;
        shard.vy += gravity * dt;
        shard.vx *= 0.988; // Slight aerodynamic drag

        // 3D rotational inertia
        shard.rotZ += shard.vRotZ * dt;
        shard.rotX += shard.vRotX * dt;
        shard.rotY += shard.vRotY * dt;

        // Lifetime decay
        shard.life -= dt / shard.duration;

        // Expired or offscreen
        if (shard.life <= 0 || shard.y > window.innerHeight + 140) {
          shards.splice(s, 1);
          continue;
        }

        // Clean fading near end of life
        const alpha = Math.max(0, Math.min(1, shard.life * 1.5));

        // 3D Perspective Projection
        const cosY = Math.cos(shard.rotY);
        const cosX = Math.cos(shard.rotX);
        const scaleX = Math.abs(cosY) < 0.12 ? 0.12 : cosY;
        const scaleY = Math.abs(cosX) < 0.12 ? 0.12 : cosX;

        // Specular Glint Flash: Light catches the face of the rotating glass
        const glintAlignment = Math.abs(Math.sin(shard.rotY) * Math.cos(shard.rotX));
        const isGlinting = glintAlignment > 0.82;

        ctx.save();
        ctx.translate(shard.x, shard.y);
        ctx.rotate(shard.rotZ);
        ctx.scale(scaleX, scaleY);

        // Build shard polygon path
        ctx.beginPath();
        ctx.moveTo(shard.vertices[0].x, shard.vertices[0].y);
        for (let i = 1; i < shard.vertices.length; i++) {
          ctx.lineTo(shard.vertices[i].x, shard.vertices[i].y);
        }
        ctx.closePath();

        // Authentic Glass Gradient: Pure Ice, Crystal Cyan, Diamond White (NO YELLOW)
        const grad = ctx.createLinearGradient(
          -shard.size,
          -shard.size,
          shard.size,
          shard.size
        );

        if (isGlinting) {
          // Intense specular light reflection
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.98})`);
          grad.addColorStop(0.3, `rgba(235, 250, 255, ${alpha * 0.92})`);
          grad.addColorStop(0.7, `rgba(185, 225, 245, ${alpha * 0.65})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.45})`);
        } else {
          // Normal crystalline refraction
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.85})`);
          grad.addColorStop(0.35, `rgba(215, 240, 255, ${alpha * 0.45})`);
          grad.addColorStop(0.75, `rgba(165, 215, 245, ${alpha * 0.22})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.15})`);
        }

        ctx.fillStyle = grad;
        ctx.shadowColor = isGlinting ? "rgba(255, 255, 255, 0.95)" : "rgba(190, 235, 255, 0.85)";
        ctx.shadowBlur = isGlinting ? 14 : 7;
        ctx.fill();

        // Sharp Specular Rim Border along every cut edge
        ctx.strokeStyle = isGlinting
          ? `rgba(255, 255, 255, ${alpha * 1.0})`
          : `rgba(255, 255, 255, ${alpha * 0.94})`;
        ctx.lineWidth = shard.shardType === "large" ? 2.5 : 2.0;
        ctx.lineJoin = "miter";
        ctx.stroke();

        // Internal facet reflection cut (shows 3D glass thickness)
        ctx.beginPath();
        ctx.moveTo(shard.internalFacet.x1, shard.internalFacet.y1);
        ctx.lineTo(shard.internalFacet.x2, shard.internalFacet.y2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.restore();
      }

      // 4. Tactical Video Game Reload Animation at Click Position (High-Visibility HUD)
      const reloads = reloadsRef.current;
      for (let r = reloads.length - 1; r >= 0; r--) {
        const reload = reloads[r];
        reload.time += dt;

        const totalLife = reload.duration + 0.28; // Active duration + sleek settle fadeout
        if (reload.time >= totalLife) {
          reloads.splice(r, 1);
          continue;
        }

        const isComplete = reload.time >= reload.duration;
        const progress = Math.min(1, reload.time / reload.duration);

        // Alpha calculation: instantaneous vibrant pop-in (0.04s), then smooth fadeout on lock
        let alpha = 1;
        if (reload.time < 0.04) {
          alpha = reload.time / 0.04;
        } else if (isComplete) {
          const fadeProgress = (reload.time - reload.duration) / 0.28;
          alpha = Math.max(0, 1 - fadeProgress);
        }

        ctx.save();
        ctx.translate(reload.x, reload.y);
        ctx.globalAlpha = alpha;

        // Compact realistic scale: base ring radius is ~17px (total reticle footprint ~40-44px)
        const baseRadius = 17;
        const popScale = isComplete ? 1 + (1 - alpha) * 0.12 : 1;
        const radius = baseRadius * popScale;

        // 1. Sleek Obsidian Glass Lens Disc (ensures crisp contrast over light or dark backgrounds)
        const lensRadius = 22 * popScale;
        ctx.beginPath();
        ctx.arc(0, 0, lensRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(4, 10, 18, 0.85)";
        ctx.shadowColor = isComplete ? "rgba(255, 255, 255, 0.55)" : "rgba(0, 240, 255, 0.65)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.strokeStyle = isComplete ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 240, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 2. High-Tech Precision Corner Reticle Notches [ ]
        const bracketDist = 24.5 * popScale;
        const bracketSize = 3.5;
        ctx.strokeStyle = isComplete ? "#ffffff" : "rgba(0, 240, 255, 0.85)";
        ctx.lineWidth = 1.2;
        ctx.shadowColor = isComplete ? "#ffffff" : "#00f0ff";
        ctx.shadowBlur = 5;
        for (let b = 0; b < 4; b++) {
          const a = (b * Math.PI) / 2 + Math.PI / 4;
          const bx = Math.cos(a) * bracketDist;
          const by = Math.sin(a) * bracketDist;
          ctx.beginPath();
          ctx.moveTo(bx, by - Math.sign(by) * bracketSize);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx - Math.sign(bx) * bracketSize, by);
          ctx.stroke();
        }

        // 3. Razor-Sharp Reload Progress Arc
        // Background track groove
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Active sweeping arc from 12 o'clock clockwise
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + progress * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.strokeStyle = isComplete ? "#ffffff" : "#00f0ff";
        ctx.shadowColor = isComplete ? "#ffffff" : "#00f0ff";
        ctx.shadowBlur = isComplete ? 10 : 8;
        ctx.lineWidth = isComplete ? 2.2 : 2.0;
        ctx.lineCap = "round";
        ctx.stroke();

        // Glowing specular micro-bead at head of arc
        const tipX = Math.cos(endAngle) * radius;
        const tipY = Math.sin(endAngle) * radius;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = isComplete ? "#ffffff" : "#00f0ff";
        ctx.shadowBlur = 6;
        ctx.fill();

        // 4. Quad-Cell Arc Reactor Chamber Pips (efficient 4-step power cycle)
        const cellCount = 4;
        const cellRadius = 9.5 * popScale;
        const spin = isComplete ? 0 : reload.time * 4.2;
        for (let c = 0; c < cellCount; c++) {
          const ca = (c * Math.PI * 2) / cellCount + spin;
          const cx = Math.cos(ca) * cellRadius;
          const cy = Math.sin(ca) * cellRadius;
          const isCharged = isComplete || progress >= (c + 1) / cellCount;

          ctx.beginPath();
          ctx.arc(cx, cy, 1.3, 0, Math.PI * 2);
          if (isCharged) {
            ctx.fillStyle = isComplete ? "#ffffff" : "#00f0ff";
            ctx.shadowColor = isComplete ? "#ffffff" : "#00f0ff";
            ctx.shadowBlur = 5;
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }

        // 5. Center Reticle Cross / Completion Starburst Glint
        if (!isComplete) {
          // Precise 1px micro crosshair
          ctx.strokeStyle = "rgba(0, 240, 255, 0.75)";
          ctx.lineWidth = 1;
          ctx.shadowBlur = 3;
          ctx.shadowColor = "#00f0ff";
          ctx.beginPath();
          ctx.moveTo(-2.5, 0); ctx.lineTo(2.5, 0);
          ctx.moveTo(0, -2.5); ctx.lineTo(0, 2.5);
          ctx.stroke();
        } else {
          // Magnificent diamond star glint on lock
          const glintProgress = (reload.time - reload.duration) / 0.28;
          const glintScale = (1 - glintProgress) * 4.5;
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -glintScale);
          ctx.lineTo(glintScale * 0.35, -glintScale * 0.35);
          ctx.lineTo(glintScale, 0);
          ctx.lineTo(glintScale * 0.35, glintScale * 0.35);
          ctx.lineTo(0, glintScale);
          ctx.lineTo(-glintScale * 0.35, glintScale * 0.35);
          ctx.lineTo(-glintScale, 0);
          ctx.lineTo(-glintScale * 0.35, -glintScale * 0.35);
          ctx.closePath();
          ctx.fill();
        }

        // 6. Compact Micro Monospace Telemetry Badge (efficient, realistic HUD readout)
        const tagY = 27 * popScale;
        const tagW = 32;
        const tagH = 11;
        const tagR = 3;
        const tx = -tagW / 2;
        const ty = tagY - tagH / 2;

        ctx.beginPath();
        ctx.moveTo(tx + tagR, ty);
        ctx.lineTo(tx + tagW - tagR, ty);
        ctx.arcTo(tx + tagW, ty, tx + tagW, ty + tagR, tagR);
        ctx.lineTo(tx + tagW, ty + tagH - tagR);
        ctx.arcTo(tx + tagW, ty + tagH, tx + tagW - tagR, ty + tagH, tagR);
        ctx.lineTo(tx + tagR, ty + tagH);
        ctx.arcTo(tx, ty + tagH, tx, ty + tagH - tagR, tagR);
        ctx.lineTo(tx, ty + tagR);
        ctx.arcTo(tx, ty, tx + tagR, ty, tagR);
        ctx.closePath();

        ctx.fillStyle = "rgba(3, 8, 15, 0.92)";
        ctx.fill();
        ctx.strokeStyle = isComplete ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 240, 255, 0.45)";
        ctx.lineWidth = 0.9;
        ctx.shadowColor = isComplete ? "#ffffff" : "#00f0ff";
        ctx.shadowBlur = 4;
        ctx.stroke();

        ctx.font = "bold 7.5px var(--font-geist-mono), 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (!isComplete) {
          const percent = Math.floor(progress * 100);
          ctx.fillStyle = "#00f0ff";
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 6;
          ctx.fillText(`${percent}%`, 0, tagY + 0.5);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 8;
          ctx.fillText("LOCK", 0, tagY + 0.5);
        }

        // 7. Micro Completion Shockwave Pulse
        if (isComplete) {
          const flashProgress = (reload.time - reload.duration) / 0.28;
          const shockRadius = (radius + flashProgress * 12) * popScale;
          const shockAlpha = (1 - flashProgress) * 0.85;
          ctx.beginPath();
          ctx.arc(0, 0, shockRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${shockAlpha})`;
          ctx.lineWidth = 1.5 * (1 - flashProgress);
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 6;
          ctx.stroke();
        }

        ctx.restore();
      }

      // Check if any element is still active
      const hasActive =
        shardsRef.current.length > 0 ||
        websRef.current.length > 0 ||
        splintersRef.current.length > 0 ||
        reloadsRef.current.length > 0;

      if (hasActive) {
        rafIdRef.current = requestAnimationFrame(animatePhysicsLoop);
      } else {
        rafIdRef.current = null;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
    };

    // Gesture-aware click & touch handlers: allow smooth mobile swiping without accidental shatter/reload
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        touchStartX = e.clientX;
        touchStartY = e.clientY;
        touchStartTime = performance.now();
        isSwiping = false;
        return; // Defer touch: wait to determine if user is swiping or tapping
      }
      if (e.button === 0 || e.button === 2) {
        triggerVideoGameShatter(e.clientX, e.clientY);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" && !isSwiping) {
        const dist = Math.hypot(e.clientX - touchStartX, e.clientY - touchStartY);
        if (dist > 10) {
          isSwiping = true;
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        const dist = Math.hypot(e.clientX - touchStartX, e.clientY - touchStartY);
        const elapsed = performance.now() - touchStartTime;
        // Only trigger on an intentional stationary tap (< 12px movement, < 350ms duration)
        if (!isSwiping && dist < 12 && elapsed < 350) {
          triggerVideoGameShatter(e.clientX, e.clientY);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Suppress browser menu so glass break is completely visible
      triggerVideoGameShatter(e.clientX, e.clientY);
    };

    window.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointermove", handlePointerMove, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointerup", handlePointerUp, {
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
      window.removeEventListener("pointermove", handlePointerMove, {
        capture: true,
      });
      window.removeEventListener("pointerup", handlePointerUp, {
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
      className="pointer-events-none fixed inset-0 z-[999999] hidden md:block h-screen w-screen overflow-hidden"
      aria-hidden="true"
    />
  );
}
