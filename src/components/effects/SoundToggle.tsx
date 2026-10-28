"use client";

import { useEffect, useState } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { soundController } from "@/components/effects/SoundController";
import { MagneticButton } from "@/components/effects/MagneticButton";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(soundController.isEnabled());
  }, []);

  const handleToggle = () => {
    const newState = soundController.toggle();
    setEnabled(newState);
  };

  return (
    <MagneticButton strength={0.25}>
      <button
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => soundController.playTick()}
        className={`nav-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
          enabled
            ? "border-accent/40 text-accent shadow-[0_0_12px_rgba(212,162,47,0.3)]"
            : "text-zinc-400 hover:text-white"
        }`}
        aria-pressed={enabled}
        aria-label={enabled ? "Disable tactical audio" : "Enable tactical audio"}
        title={enabled ? "Disable tactical audio" : "Enable tactical audio"}
      >
        {enabled ? (
          <SpeakerHigh size={14} weight="bold" className="text-accent" />
        ) : (
          <SpeakerSlash size={14} weight="bold" />
        )}
        <span>{enabled ? "SFX ON" : "SFX OFF"}</span>
      </button>
    </MagneticButton>
  );
}
