import { useMemo } from "react";

/** Deterministic, QR-looking SVG for the mock SEPA (EPC) payload. */
export function SepaQr({ payload, size = 200 }: { payload: string; size?: number }) {
  const N = 29;
  const cells = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < payload.length; i++) seed = (seed * 31 + payload.charCodeAt(i)) >>> 0;
    const rand = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) % 1000) / 1000;
    };
    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
    const out: Array<[number, number]> = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) if (!inFinder(x, y) && rand() > 0.52) out.push([x, y]);
    return out;
  }, [payload]);

  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} rx={1.6} className="fill-qr-foreground" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1.1} className="fill-qr" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.8} className="fill-qr-foreground" />
    </g>
  );

  return (
    <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} width={size} height={size} role="img" aria-label="SEPA QR код">
      <rect x={-2} y={-2} width={N + 4} height={N + 4} rx={3} className="fill-qr" />
      {cells.map(([x, y]) => (
        <rect key={`${x}:${y}`} x={x + 0.08} y={y + 0.08} width={0.84} height={0.84} rx={0.25} className="fill-qr-foreground" />
      ))}
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
    </svg>
  );
}
