import { useEffect, useRef } from 'react';

type Point = { x: number; y: number };

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function waveHeight(u: number, v: number, time: number): number {
  const drift = time * 0.62;
  const cross = time * 0.28;

  return (
    Math.sin(u * 9.2 + drift) * 0.24 +
    Math.sin(u * 4.6 - drift * 0.82 + v * 4.8) * 0.18 +
    Math.cos(v * 6.4 + cross) * 0.15 +
    Math.sin((u * 1.8 + v) * 7.6 + drift * 1.35) * 0.11 +
    Math.cos(u * 2.4 - v * 3.1 + cross * 1.4) * 0.08
  );
}

function buildTerrainMesh(
  width: number,
  height: number,
  time: number,
): Point[][] {
  const cols = Math.min(72, Math.max(40, Math.floor(width / 14)));
  const rows = Math.min(44, Math.max(28, Math.floor(height / 16)));
  const points: Point[][] = [];
  const spanX = width * 1.28;
  const spanZ = height * 0.92;
  const originX = width * -0.14;
  const originY = height * 0.22;
  const tilt = 0.52;

  for (let row = 0; row < rows; row += 1) {
    const rowPoints: Point[] = [];
    points[row] = rowPoints;
    const v = row / (rows - 1);

    for (let col = 0; col < cols; col += 1) {
      const u = col / (cols - 1);
      const x3 = u * spanX;
      const z3 = v * spanZ;
      const elevation = waveHeight(u, v, time) * height * 0.11;
      const depth = 0.68 + v * 0.72;
      const x = originX + (x3 - spanX * 0.08) * depth + Math.sin(v * 2.6 + time * 0.22) * 10 * v;
      const y = originY + z3 * tilt + elevation * depth + v * height * 0.08;

      rowPoints[col] = { x, y };
    }
  }

  return points;
}

function drawAmbientGlow(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const glow = ctx.createRadialGradient(
    width * 0.28,
    height * 0.78,
    0,
    width * 0.38,
    height * 0.72,
    width * 0.68,
  );
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.1)');
  glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.05)');
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawNodeField(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const count = Math.floor((width * height) / 22000);
  for (let index = 0; index < count; index += 1) {
    const px = (((index * 131) % 1000) / 1000) * width;
    const py = (((index * 79) % 1000) / 1000) * height * 0.42;
    const alpha = 0.05 + ((index * 19) % 100) / 280;
    ctx.fillStyle = `rgba(224, 247, 255, ${alpha})`;
    ctx.fillRect(px, py, 1, 1);
  }
}

function strokePolyline(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  strokeStyle: string,
  lineWidth: number,
): void {
  if (points.length < 2) {
    return;
  }

  const first = points[0];
  if (!first) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (!point) {
      continue;
    }
    ctx.lineTo(point.x, point.y);
  }
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawMeshGlow(ctx: CanvasRenderingContext2D, points: Point[][]): void {
  const rows = points.length;
  const cols = points[0]?.length ?? 0;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';

  for (let row = 0; row < rows; row += 1) {
    const depth = row / (rows - 1);
    const rowPoints = points[row];
    if (!rowPoints) {
      continue;
    }
    strokePolyline(ctx, rowPoints, `rgba(34, 211, 238, ${0.04 + depth * 0.1})`, 2.4);
  }

  for (let col = 0; col < cols; col += 3) {
    const depth = col / (cols - 1);
    const columnPoints: Point[] = [];
    for (let row = 0; row < rows; row += 1) {
      const point = points[row]?.[col];
      if (point) {
        columnPoints.push(point);
      }
    }
    strokePolyline(ctx, columnPoints, `rgba(56, 189, 248, ${0.03 + depth * 0.08})`, 2.1);
  }

  ctx.restore();
}

function drawMeshSharp(ctx: CanvasRenderingContext2D, points: Point[][]): void {
  const rows = points.length;
  const cols = points[0]?.length ?? 0;

  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.shadowBlur = 0;

  for (let row = 0; row < rows; row += 1) {
    const depth = row / (rows - 1);
    const alpha = 0.14 + depth * 0.62;
    const stroke =
      depth > 0.72
        ? `rgba(186, 245, 255, ${alpha})`
        : depth > 0.42
          ? `rgba(56, 189, 248, ${alpha})`
          : `rgba(14, 165, 233, ${alpha * 0.85})`;
    const rowPoints = points[row];
    if (rowPoints) {
      strokePolyline(ctx, rowPoints, stroke, 1);
    }
  }

  for (let col = 0; col < cols; col += 1) {
    const depth = col / (cols - 1);
    const alpha = 0.1 + depth * 0.42;
    const columnPoints: Point[] = [];
    for (let row = 0; row < rows; row += 1) {
      const point = points[row]?.[col];
      if (point) {
        columnPoints.push(point);
      }
    }
    strokePolyline(ctx, columnPoints, `rgba(125, 211, 252, ${alpha})`, 1);
  }

  ctx.restore();
}

function drawIntersectionNodes(ctx: CanvasRenderingContext2D, points: Point[][]): void {
  const rows = points.length;
  const cols = points[0]?.length ?? 0;
  const step = rows > 34 ? 2 : 1;

  ctx.save();
  ctx.shadowBlur = 0;

  for (let row = 0; row < rows; row += step) {
    const depth = row / (rows - 1);
    if (depth < 0.12) {
      continue;
    }

    for (let col = 0; col < cols; col += step) {
      const point = points[row]?.[col];
      if (!point) {
        continue;
      }
      const alpha = 0.18 + depth * 0.55;
      ctx.fillStyle = `rgba(224, 247, 255, ${alpha})`;
      ctx.fillRect(point.x, point.y, 1, 1);

      if (depth > 0.45 && (row + col) % 3 === 0) {
        ctx.fillStyle = `rgba(34, 211, 238, ${0.08 + depth * 0.14})`;
        ctx.fillRect(point.x - 1, point.y - 1, 3, 3);
      }
    }
  }

  ctx.restore();
}

function paintFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
): void {
  ctx.clearRect(0, 0, width, height);
  drawAmbientGlow(ctx, width, height);
  drawNodeField(ctx, width, height);

  const mesh = buildTerrainMesh(width, height, time);
  drawMeshGlow(ctx, mesh);
  drawMeshSharp(ctx, mesh);
  drawIntersectionNodes(ctx, mesh);
}

export function LoginBrandWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const isTestEnv = import.meta.env.MODE === 'test';

  useEffect(() => {
    if (isTestEnv) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    } catch {
      return;
    }

    if (!context) {
      return;
    }

    const reducedMotion = prefersReducedMotion();
    let width = 0;
    let height = 0;
    const startTime = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    };

    const animate = (now: number) => {
      const time = reducedMotion ? 0 : (now - startTime) / 1000;
      paintFrame(context, width, height, time);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    resize();
    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas.parentElement ?? canvas);

    if (!reducedMotion) {
      frameRef.current = window.requestAnimationFrame(animate);
    } else {
      paintFrame(context, width, height, 0);
    }

    return () => {
      resizeObserver.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isTestEnv]);

  if (isTestEnv) {
    return <div className="login-page__brand-waves" aria-hidden="true" data-testid="login-brand-waves" />;
  }

  return <canvas ref={canvasRef} className="login-page__brand-waves" aria-hidden="true" />;
}
