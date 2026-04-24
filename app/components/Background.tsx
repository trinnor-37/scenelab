"use client";

import { useRef, useEffect } from "react";

function BlobBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    const blobs = [
      { x:.14, y:.20, r:.58, vx:.00018,  vy:.00012,  ph:0,    ho:205 },
      { x:.76, y:.14, r:.64, vx:-.00015, vy:.00018,  ph:1.05, ho:280 },
      { x:.50, y:.56, r:.54, vx:.00022,  vy:-.00015, ph:2.10, ho:162 },
      { x:.88, y:.78, r:.60, vx:-.00018, vy:.00022,  ph:3.15, ho:318 },
      { x:.08, y:.68, r:.50, vx:.00012,  vy:-.00018, ph:4.20, ho:58  },
      { x:.62, y:.88, r:.47, vx:-.00020, vy:.00010,  ph:5.25, ho:142 },
      { x:.30, y:.38, r:.52, vx:.00016,  vy:.00020,  ph:0.52, ho:248 },
      { x:.47, y:.07, r:.45, vx:.00020,  vy:.00015,  ph:1.80, ho:300 },
      { x:.92, y:.36, r:.42, vx:-.00022, vy:.00012,  ph:2.65, ho:180 },
    ];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.fillStyle = "rgb(2,8,16)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      blobs.forEach(b => {
        b.ph += .003;
        b.x  += b.vx; b.y += b.vy;
        if (b.x < -.15 || b.x > 1.15) b.vx *= -1;
        if (b.y < -.15 || b.y > 1.15) b.vy *= -1;
        const cx = b.x * canvas.width;
        const cy = b.y * canvas.height;
        const r  = b.r * Math.min(canvas.width, canvas.height);
        const mr = r * (0.9 + 0.1 * Math.sin(b.ph));
        const hue = (b.ho + t * 18) % 360;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, mr);
        g.addColorStop(0,   `hsla(${hue},100%,65%,0.54)`);
        g.addColorStop(.45, `hsla(${(hue + 110) % 360},100%,55%,0.28)`);
        g.addColorStop(1,   "transparent");
        ctx.save();
        ctx.filter = "blur(40px)";
        ctx.beginPath();
        for (let i = 0; i <= 28; i++) {
          const a  = (i / 28) * Math.PI * 2;
          const w  = 1 + .18 * Math.sin(a * 3 + b.ph) + .09 * Math.sin(a * 5 + b.ph * .7);
          const px = cx + Math.cos(a) * mr * w;
          const py = cy + Math.sin(a) * mr * w;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      });

      t += .005;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="blob-bg" />;
}

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }, () => ({
      x:            Math.random() * canvas.width,
      y:            Math.random() * canvas.height,
      r:            Math.random() * 1.4 + 0.3,
      vy:           -(Math.random() * 0.35 + 0.12),
      vx:           (Math.random() - 0.5) * 0.18,
      alpha:        Math.random() * 0.55 + 0.08,
      flicker:      Math.random() * Math.PI * 2,
      flickerSpeed: Math.random() * 0.03 + 0.01,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y       += p.vy;
        p.x       += p.vx;
        p.flicker += p.flickerSpeed;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.flicker));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,230,255,${a})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="particles-canvas" />;
}

export default function Background() {
  return (
    <>
      <BlobBackground />
      <Particles />
    </>
  );
}
