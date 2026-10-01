// src/features/weight/components/WeightChart.jsx
import React, { useEffect, useRef } from "react";
import styles from "../css/WeightRecord.module.css";

/** records: [{date:'YYYY-MM-DD', weight:Number}] */
export default function WeightChart({ records = [], title = "체중 (kg)", yLabel = "kg" }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const roRef = useRef(null);

  const data = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

  // 보기 좋은 정수 간격(1,2,5×10^n)
  const niceStepInt = (range, target = 7) => {
    if (!(range > 0) || !isFinite(range)) return 1;
    const raw = range / target;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / pow;
    let nice;
    if (norm <= 1) nice = 1;
    else if (norm <= 2) nice = 2;
    else if (norm <= 5) nice = 5;
    else nice = 10;
    return Math.max(1, Math.round(nice * pow)); // 무조건 정수 간격
  };

  const draw = () => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const Wcss = wrap.clientWidth, Hcss = 360;
    canvas.style.width = `${Wcss}px`; canvas.style.height = `${Hcss}px`;
    canvas.width = Math.max(1, Math.floor(Wcss * dpr));
    canvas.height = Math.floor(Hcss * dpr);

    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,W,H);

    const padL = 64*dpr, padR = 24*dpr, padT = 36*dpr, padB = 48*dpr;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    // Y축 범위
    const ys = data.map(d=>Number(d.weight)).filter(v=>isFinite(v));
    let minY = ys.length ? Math.min(...ys) : 60;
    let maxY = ys.length ? Math.max(...ys) : 90;
    const pad = Math.max(1, (maxY - minY || 10) * 0.15);
    minY = Math.floor(minY - pad);
    maxY = Math.ceil(maxY + pad);

    const step = niceStepInt(maxY - minY, 7);
    const yMin = Math.floor(minY / step) * step;
    const yMax = Math.ceil(maxY / step) * step;

    const xs = data.map(d=>new Date(d.date).getTime());
    const x0 = xs.length ? xs[0] : Date.now()-86400000;
    const x1 = xs.length ? xs[xs.length-1] : Date.now();

    const x2px = (t)=> padL + (plotW * (t - x0))/Math.max(1,(x1 - x0 || 1));
    const y2px = (v)=> padT + plotH - plotH * (v - yMin)/Math.max(1,(yMax - yMin));

    // grid
    ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1*dpr;
    for(let y=yMin; y<=yMax+1e-9; y+=step){
      const py = y2px(y);
      ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(W-padR, py); ctx.stroke();
    }

    // Y labels (정수만)
    ctx.fillStyle = "#6b7280"; ctx.font = `${12*dpr}px sans-serif`;
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for(let y=yMin; y<=yMax+1e-9; y+=step){
      const py = y2px(y);
      ctx.fillText(`${Math.round(y)}`, padL-8*dpr, py);
    }

    // title
    ctx.fillStyle = "#111"; ctx.font = `${14*dpr}px sans-serif`;
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(title, padL, padT-12*dpr);

    // line + points
    if (data.length){
      ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2.5*dpr;
      ctx.beginPath();
      data.forEach((p,i)=>{ const x=x2px(new Date(p.date).getTime()), y=y2px(p.weight); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
      ctx.stroke();
      ctx.fillStyle = "#3b82f6";
      data.forEach(p=>{ const x=x2px(new Date(p.date).getTime()), y=y2px(p.weight); ctx.beginPath(); ctx.arc(x,y,3.5*dpr,0,Math.PI*2); ctx.fill(); });
    }

    // X labels
    ctx.fillStyle = "#6b7280"; ctx.font = `${11*dpr}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    if (data[0]?.date) ctx.fillText(data[0].date, padL, H-padB+8*dpr);
    if (data[data.length-1]?.date) ctx.fillText(data[data.length-1].date, W-padR, H-padB+8*dpr);
  };

  useEffect(() => {
    draw();
    roRef.current?.disconnect();
    roRef.current = new ResizeObserver(() => draw());
    if (wrapRef.current) roRef.current.observe(wrapRef.current);
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => { roRef.current?.disconnect(); window.removeEventListener("resize", onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  return (
    <div ref={wrapRef}>
      <canvas ref={canvasRef} className={styles.chartCanvas} />
    </div>
  );
}
