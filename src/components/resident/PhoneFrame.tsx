import { BatteryFull, Signal, Wifi } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Android-style device frame on tablet/desktop; on a real phone the app
 * fills the screen with no frame.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex h-[calc(100dvh-6.5rem)] w-full flex-col overflow-hidden bg-background sm:h-[860px] sm:w-[400px] sm:rounded-[3rem] sm:border-[10px] sm:border-bezel sm:shadow-phone">
      <StatusBar />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      <div className="hidden h-5 shrink-0 items-center justify-center bg-card sm:flex">
        <span className="h-1 w-28 rounded-full bg-foreground/30" />
      </div>
    </div>
  );
}

function StatusBar() {
  const [time, setTime] = useState("19:51");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative hidden h-8 shrink-0 items-center justify-between bg-background px-6 text-[12px] font-semibold sm:flex">
      <span className="tabular">{time}</span>
      <span className="absolute left-1/2 top-2 size-3.5 -translate-x-1/2 rounded-full bg-bezel" />
      <span className="flex items-center gap-1.5">
        <Signal className="size-3.5" />
        <Wifi className="size-3.5" />
        <BatteryFull className="size-4" />
      </span>
    </div>
  );
}
