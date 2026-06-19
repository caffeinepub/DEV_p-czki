import DonutScene from "@/components/DonutScene";
import type { DonutSceneHandle } from "@/components/DonutScene";
import HUD from "@/components/HUD";
import LoadingOverlay from "@/components/LoadingOverlay";
import { Suspense, useCallback, useRef, useState } from "react";

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const sceneRef = useRef<DonutSceneHandle>(null);

  const handleReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const handleReset = useCallback(() => {
    sceneRef.current?.resetAll();
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "oklch(0.12 0.02 50)" }}
      data-ocid="app.canvas_target"
    >
      <LoadingOverlay visible={!isReady} />

      <Suspense fallback={<LoadingOverlay visible />}>
        <DonutScene ref={sceneRef} onReady={handleReady} />
      </Suspense>

      <HUD onReset={handleReset} />
    </div>
  );
}
