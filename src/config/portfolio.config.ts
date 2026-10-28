/**
 * PORTFOLIO & FRAME SEQUENCE CONFIGURATION
 * 
 * Customize total frames, paths, interpolation physics, adaptive quality,
 * and toggle individual polished effects on or off.
 */

export interface StoryBeat {
  id: string;
  startFrame: number;
  endFrame: number;
  label: string;
  quote: string;
  speaker: string;
  subtext: string;
}

export const portfolioConfig = {
  // ==========================================
  // 1. FRAME SEQUENCE & RENDERING SETTINGS
  // ==========================================
  sequence: {
    /** Total number of frames in the sequence */
    totalFrames: 600,

    /** Primary frame path pattern (recommended: 1280px WebP) */
    framePathPattern: (index: number) => `/amazing_spiderman/frame-${index}.png`,

    /** Optional WebP optimized path pattern (set to this once converted) */
    webpPathPattern: (index: number) => `/amazing_spiderman/frame-${index}.webp`,

    /** Lerp interpolation speed (0.28 for responsive, zero-latency tracking) */
    lerpSpeed: 0.28,

    /** Number of frames to skip on low-end hardware / mobile (2 = use every 2nd frame = 300 frames) */
    mobileFrameStep: 2,

    /** Immediate preload batch: number of initial frames required before unlocking page */
    initialPreloadBatch: 40,

    /** Maximum decoded frames to keep in memory (sliding window around active frame) */
    maxCachedFramesDesktop: 70,
    maxCachedFramesMobile: 30,

    /** Max devicePixelRatio for canvas backing store (capped for GPU efficiency) */
    maxDprDesktop: 2.0,
    maxDprMobile: 1.25,

    /** Scroll height factor in vh for pinning the sequence (e.g. 450 = 4.5 screens of scroll) */
    scrollDistanceVh: 450,
  },

  // ==========================================
  // 2. ADAPTIVE HARDWARE DETECTION
  // ==========================================
  hardware: {
    /** CPU concurrency threshold under which device is considered low-end */
    lowConcurrencyThreshold: 4,

    /** Mobile breakpoint width (px) */
    mobileBreakpoint: 768,
  },

  // ==========================================
  // 3. STORYTELLING BEATS (Synced to frame range)
  // ==========================================
  storyBeats: [
    {
      id: "beat-1",
      startFrame: 35,
      endFrame: 175,
      label: "SECTOR 01 // ANALYSIS",
      quote: "There are only plain, hard facts.",
      speaker: "RAHUL B",
      subtext: "DATA ANALYST // 2024",
    },
    {
      id: "beat-2",
      startFrame: 220,
      endFrame: 370,
      label: "SECTOR 02 // STACK",
      quote: "SQL • Python • Power BI • Machine Learning",
      speaker: "CORE ARSENAL",
      subtext: "PERFORMANCE MODELING",
    },
    {
      id: "beat-3",
      startFrame: 410,
      endFrame: 560,
      label: "SECTOR 03 // EXECUTION",
      quote: "Transforming chaos into actionable intelligence.",
      speaker: "MISSION DIRECTIVE",
      subtext: "TACTICAL REPORTING",
    },
  ] as StoryBeat[],

  // ==========================================
  // 4. POLISHED EFFECTS TOGGLES
  // ==========================================
  effects: {
    /** 1. FPS Game HUD Overlay (health/ammo scroll bar, sector readout, live FPS counter) */
    fpsHud: true,

    /** 2. Custom Crosshair Cursor (mouse lerp, hover expansion, recoil pulse on click) */
    customCrosshair: true,

    /** 3. Scroll-Synced Storytelling text cards with frame-range mask animations */
    scrollStorytelling: true,

    /** 4. Velocity-based Chromatic Aberration & subtle heading skew while scrolling fast */
    velocityAberration: true,

    /** 5. Cinematic Overlay (subtle vignette, 4% scanlines, fine film grain) */
    cinematicOverlay: true,

    /** 6. Text Reveals (staggered word/character mask reveals for headings) */
    textReveal: true,

    /** 7. Magnetic Buttons and interactive links */
    magneticElements: true,

    /** 8. Project & Skill Cards 3D Tilt with glare and corner target lock brackets */
    cardTilt: true,

    /** 9. Section Transitions (clean 300ms tactical scan flash between major sections) */
    sectionGlitch: true,

    /** 10. Web Audio API synthesized tactical sound effects (tick & shot) */
    uiSounds: true, // Always active: plays on every user click
  },

  // ==========================================
  // 5. THEME TOKENS
  // ==========================================
  theme: {
    accent: "#d4a22f", // Stark Titanium-Gold
    accentRgb: "212, 162, 47",
    hudLine: "rgba(255, 255, 255, 0.12)",
    background: "#0a0a0b",
  },
};
