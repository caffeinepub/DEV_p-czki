interface LoadingOverlayProps {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: "oklch(0.12 0.02 50)" }}
      data-ocid="loading.overlay"
    >
      {/* Spinning donut ring */}
      <div className="relative w-20 h-20 mb-6" data-ocid="loading.spinner">
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{
            borderTopColor: "#FFB3C6",
            borderRightColor: "#F5D06A",
            animationDuration: "0.9s",
          }}
        />
        <div
          className="absolute inset-3 rounded-full border-4 border-transparent animate-spin"
          style={{
            borderTopColor: "#D4497A",
            borderLeftColor: "#5C3317",
            animationDuration: "1.4s",
            animationDirection: "reverse",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl" role="img" aria-label="donut">
            🍩
          </span>
        </div>
      </div>
      <p
        className="font-display text-xl font-black tracking-tight"
        style={{
          background: "linear-gradient(135deg, #FFB3C6, #F5D06A)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Pączki
      </p>
      <p className="font-body text-xs text-muted-foreground mt-1 tracking-widest uppercase">
        Ładowanie pączków…
      </p>
    </div>
  );
}
