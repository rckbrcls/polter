import { useState, useEffect } from "react";
import { useStdout } from "ink";

export function useTerminalDimensions(): { width: number; height: number } {
  const { stdout } = useStdout();

  const [dimensions, setDimensions] = useState(() => ({
    width: stdout?.columns ?? process.stdout.columns ?? 80,
    height: stdout?.rows ?? process.stdout.rows ?? 24,
  }));

  useEffect(() => {
    const onResize = () => {
      setDimensions({
        width: stdout?.columns ?? process.stdout.columns ?? 80,
        height: stdout?.rows ?? process.stdout.rows ?? 24,
      });
    };
    process.stdout.on("resize", onResize);
    return () => {
      process.stdout.off("resize", onResize);
    };
  }, [stdout]);

  return dimensions;
}
