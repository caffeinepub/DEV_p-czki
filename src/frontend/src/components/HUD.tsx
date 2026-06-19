import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface HUDProps {
  onReset: () => void;
}

export default function HUD({ onReset }: HUDProps) {
  const [hintsVisible, setHintsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setHintsVisible(false), 5000);

    const events = ["mousedown", "touchstart", "wheel", "keydown"] as const;
    const handleInteraction = () => {
      setHintsVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    for (const e of events) {
      window.addEventListener(e, handleInteraction, { once: true });
    }

    return () => {
      for (const e of events) {
        window.removeEventListener(e, handleInteraction);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      {/* Top header */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col items-center pt-6 pb-4 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,8,14,0.88) 60%, transparent)",
        }}
        data-ocid="hud.header"
      >
        <h1
          className="font-display text-4xl md:text-5xl font-black tracking-tight leading-none"
          style={{
            background:
              "linear-gradient(135deg, #FFB3C6 0%, #F5D06A 35%, #D4497A 65%, #F5F0E8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 18px rgba(255,179,198,0.5))",
          }}
        >
          Pączki
        </h1>
        <p className="text-sm md:text-base font-body mt-1 text-muted-foreground tracking-wide">
          Interaktywny plac zabaw z pączkami
        </p>
      </div>

      {/* Reset button top-right */}
      <div className="absolute top-4 right-4 z-20" data-ocid="hud.reset_button">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="bg-card/80 backdrop-blur-sm border-border/60 hover:bg-card transition-smooth gap-2 font-display font-bold"
          style={{ pointerEvents: "all" }}
          data-ocid="reset.button"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      {/* Hint bar at bottom */}
      <div
        data-ocid="hud.hints"
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 pt-8 pointer-events-none z-10 transition-all duration-700"
        style={{
          background:
            "linear-gradient(to top, rgba(10,8,14,0.88) 50%, transparent)",
          opacity: hintsVisible ? 1 : 0,
        }}
      >
        <p className="font-display text-xs md:text-sm font-semibold tracking-widest uppercase text-foreground/70">
          Przeciągnij by obrócić <span className="text-[#FFB3C6]">•</span>{" "}
          Kliknij by odbić <span className="text-[#F5D06A]">•</span> Scroll by
          przybliżyć
        </p>
      </div>
    </>
  );
}
