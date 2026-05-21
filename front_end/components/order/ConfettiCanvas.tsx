"use client";

import { useEffect, useRef } from "react";

type Piece = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
};

const colors = ["#1769e0", "#087443", "#f59e0b", "#e11d48", "#7c3aed", "#14b8a6"];

export function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasElement;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    const ctx: CanvasRenderingContext2D = context;

    let frameId = 0;
    let width = 0;
    let height = 0;
    let pieces: Piece[] = [];

    function resize() {
      const pixelRatio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      pieces = Array.from({ length: 140 }, () => ({
        x: Math.random() * width,
        y: Math.random() * -height,
        size: 6 + Math.random() * 9,
        speed: 2 + Math.random() * 4,
        drift: -1.8 + Math.random() * 3.6,
        rotation: Math.random() * Math.PI,
        rotationSpeed: -0.12 + Math.random() * 0.24,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      pieces.forEach((piece) => {
        piece.y += piece.speed;
        piece.x += piece.drift;
        piece.rotation += piece.rotationSpeed;

        if (piece.y > height + 24) {
          piece.y = -24;
          piece.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * 0.65);
        ctx.restore();
      });
      frameId = window.requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    const stopTimer = window.setTimeout(() => {
      window.cancelAnimationFrame(frameId);
      ctx.clearRect(0, 0, width, height);
    }, 5200);

    return () => {
      window.clearTimeout(stopTimer);
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-40" aria-hidden="true" />;
}
