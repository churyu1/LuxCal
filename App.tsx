
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Copy,
  Layout, 
  Sun, 
  Box,
  MoveHorizontal,
  Split,
  Ruler,
  MousePointer2,
  X,
  Edit3,
  GripVertical,
  Download,
  Upload,
  Zap,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Languages
} from 'lucide-react';
import { RoomConfig, LightSource, SurfaceType, CalculationResult } from './types';

const GRID_RESOLUTION = 30; 
const INFO_TAB_ID = 'tech-reference';

const DEFAULT_ROOM: RoomConfig = {
  width: 6,
  depth: 8,
  height: 3.5,
  chamfer: 0.5,
  workPlaneHeight: 0.8,
  bodyWidth: 1.8,
  bodyHeight: 1.5,
  bodyLength: 4.8,
  bodyClearance: 0.5 
};

const COLOR_STOPS = [
  { pos: 0, color: "#0f172a" },   
  { pos: 0.25, color: "#991b1b" }, 
  { pos: 0.50, color: "#ea580c" }, 
  { pos: 0.75, color: "#facc15" }, 
  { pos: 1.0, color: "#ffffff" }   
];

// Translations dictionary
const translations = {
  ja: {
    appTitle: "LuxCalc Pro",
    techRef: "技術リファレンス",
    export: "エクスポート",
    import: "インポート",
    floorPlan: "フロアプラン",
    bodyInsp: "ボディ検査",
    roomGeometry: "部屋の形状",
    width: "幅 (m)",
    length: "奥行き (m)",
    height: "高さ (m)",
    slope: "斜め面 (m)",
    measurementPlane: "測定面",
    planeHeight: "測定高さ (m)",
    bodyGeometry: "ボディ形状",
    bodyWidth: "ボディ幅 (m)",
    bodyLength: "ボディ長さ (m)",
    bodyHeight: "ボディ高さ (m)",
    clearance: "床面クリアランス (m)",
    lights: "照明",
    pts: "箇所",
    pitch: "ピッチ (m)",
    lumens: "全光束 (lm)",
    analysis: "解析",
    realtimeVis: "リアルタイム可視化",
    totalLights: "照明総数",
    avgLabel: "平均照度",
    workPlane: "作業面",
    bodySurface: "ボディ表面",
    peak: "最大",
    floorTopView: "平面図 (フロア)",
    bodyTopView: "平面図 (ボディ)",
    sectionView: "断面図",
    doubleClick: "ダブルクリックで名前変更",
    deleteProj: "プロジェクト削除",
    refTitle: "LuxCalc Pro 技術リファレンス",
    refDesc: "建築照明設計における「点照度計算法」に基づき、リアルタイムの照度シミュレーションを行います。",
    refAlgoTitle: "基本アルゴリズム",
    refAlgoDesc: "本アプリは「逆二乗の法則」および「余弦の法則」を採用しています。",
    refGeoTitle: "幾何学的処理",
    refGeoDesc: "特殊な室内形状（45度傾斜面）に対応するため、座標変換と法線ベクトルの動的算出を行っています。",
    refSlopeDesc: "天井と壁の接続部に45度の面を定義。光源配置時にこの傾斜角度を考慮した照射方向が計算に含まれます。"
  },
  en: {
    appTitle: "LuxCalc Pro",
    techRef: "Technical Reference",
    export: "Export",
    import: "Import",
    floorPlan: "Floor Plan",
    bodyInsp: "Body Insp.",
    roomGeometry: "Room Geometry",
    width: "Width (m)",
    length: "Length (m)",
    height: "Height (m)",
    slope: "Slope (m)",
    measurementPlane: "Measurement Plane",
    planeHeight: "Height (m)",
    bodyGeometry: "Body Geometry",
    bodyWidth: "Body Width (m)",
    bodyLength: "Body Length (m)",
    bodyHeight: "Body Height (m)",
    clearance: "Clearance (m)",
    lights: "Lights",
    pts: "Pts",
    pitch: "Pitch (m)",
    lumens: "Lumens (lm)",
    analysis: "Analysis",
    realtimeVis: "Real-time Visualization",
    totalLights: "Total Lights",
    avgLabel: "AVG.",
    workPlane: "WORK PLANE",
    bodySurface: "BODY SURFACE",
    peak: "Peak",
    floorTopView: "Floor Plan (Top View)",
    bodyTopView: "Body Top View",
    sectionView: "Section View (Cross)",
    doubleClick: "Double click to rename",
    deleteProj: "Delete Project",
    refTitle: "Technical Reference",
    refDesc: "LuxCalc Pro performs real-time illuminance simulation based on the Point-by-Point Method used in architectural lighting design.",
    refAlgoTitle: "Core Algorithm",
    refAlgoDesc: "This application employs the Inverse Square Law and Cosine Law.",
    refGeoTitle: "Geometric Processing",
    refGeoDesc: "To handle unique room shapes (45-degree chamfers), dynamic coordinate transformations and normal vector calculations are performed.",
    refSlopeDesc: "A 45-degree surface is defined at the ceiling-wall intersection. The tilt angle is automatically considered when calculating light distribution."
  }
};

interface Project {
  id: string;
  name: string;
  room: RoomConfig;
  lights: LightSource[];
  calcMode: 'FLOOR' | 'BODY';
}

interface HoverInfo {
  x: number;
  y: number;
  lux: number;
  label: string;
}

const TechnicalReference: React.FC<{ t: any }> = ({ t }) => (
  <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <BookOpen size={32} />
          <h1 className="text-4xl font-black tracking-tight">{t.refTitle}</h1>
        </div>
        <p className="text-slate-400 text-lg leading-relaxed">
          {t.refDesc}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <CheckCircle2 className="text-amber-500" size={20} />
            {t.refAlgoTitle}
          </h2>
          <div className="space-y-4 text-sm text-slate-300">
            <p>{t.refAlgoDesc}</p>
            <div className="bg-slate-950 p-4 rounded-xl font-mono text-amber-400 text-center text-lg italic">
              E = (I × cos θ) / d²
            </div>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="font-bold text-slate-100">E:</span> 
                <span>Lux</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-slate-100">I:</span> 
                <span>Candela</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-slate-100">d:</span> 
                <span>Distance (m)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-slate-100">θ:</span> 
                <span>Incidence Angle</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <CheckCircle2 className="text-amber-500" size={20} />
            {t.refGeoTitle}
          </h2>
          <div className="space-y-4 text-sm text-slate-300">
            <p>{t.refGeoDesc}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500/80 uppercase tracking-wider">
                <ChevronRight size={12} /> {t.slope}
              </div>
              <p className="pl-4 border-l border-slate-700 text-xs">
                {t.refSlopeDesc}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const t = translations[language];

  const [projects, setProjects] = useState<Project[]>([
    { id: 'proj-1', name: 'Project 1', room: { ...DEFAULT_ROOM }, lights: [], calcMode: 'FLOOR' }
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-1');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const planSvgRef = useRef<SVGSVGElement>(null);
  const sectionSvgRef = useRef<SVGSVGElement>(null);
  const planContainerRef = useRef<HTMLDivElement>(null);
  const sectionContainerRef = useRef<HTMLDivElement>(null);

  const [planDims, setPlanDims] = useState({ width: 0, height: 0 });
  const [sectionDims, setSectionDims] = useState({ width: 0, height: 0 });

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || projects[0]
  , [projects, activeProjectId]);

  const { room, lights, calcMode } = activeProject;

  const updateActiveProject = (updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, ...updates } : p));
  };

  const setRoom = (newRoom: RoomConfig) => updateActiveProject({ room: newRoom });
  const setLights = (newLights: LightSource[]) => updateActiveProject({ lights: newLights });
  const setCalcMode = (newMode: 'FLOOR' | 'BODY') => updateActiveProject({ calcMode: newMode });

  const [showGuide, setShowGuide] = useState(true);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === planContainerRef.current) {
          setPlanDims({ width: entry.contentRect.width, height: entry.contentRect.height });
        } else if (entry.target === sectionContainerRef.current) {
          setSectionDims({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      }
    });
    if (planContainerRef.current) observer.observe(planContainerRef.current);
    if (sectionContainerRef.current) observer.observe(sectionContainerRef.current);
    return () => observer.disconnect();
  }, [activeProjectId]);

  const deleteProject = (id: string) => {
    if (projects.length <= 1) return;
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (activeProjectId === id) {
      setActiveProjectId(newProjects[0].id);
    }
  };

  const updateProjectName = (id: string, newName: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    setEditingProjectId(null);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newProjects = [...projects];
    const item = newProjects.splice(draggedIndex, 1)[0];
    newProjects.splice(index, 0, item);
    
    setDraggedIndex(index);
    setProjects(newProjects);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
  };

  const getExpandedLights = (light: LightSource, r: RoomConfig) => {
    const instances: {x: number, y: number, z: number}[] = [];
    const { width: W, depth: D, height: H, chamfer: C } = r;
    const getBasePos = (u: number, v: number) => {
      let x = 0, y = 0, z = 0;
      z = v * D;
      switch (light.surface) {
        case SurfaceType.CEILING: x = u * (W - 2 * C) + C; y = H; break;
        case SurfaceType.WALL_EAST: x = W; y = u * (H - C); break;
        case SurfaceType.WALL_WEST: x = 0; y = u * (H - C); break;
        case SurfaceType.SLOPE_EAST: x = W - (u * C); y = (H - C) + (u * C); break;
        case SurfaceType.SLOPE_WEST: x = u * C; y = (H - C) + (u * C); break;
      }
      return { x, y, z };
    };
    if (light.pitch <= 0) { instances.push(getBasePos(light.u, light.v)); return instances; }
    let startZ = light.v * D;
    for (let z = startZ; z <= D + 0.001; z += light.pitch) instances.push(getBasePos(light.u, z / D));
    for (let z = startZ - light.pitch; z >= -0.001; z -= light.pitch) instances.push(getBasePos(light.u, z / D));
    return instances;
  };

  const totalLightPoints = useMemo(() => lights.reduce((sum, l) => sum + getExpandedLights(l, room).length, 0), [lights, room]);

  const results = useMemo(() => {
    if (activeProjectId === INFO_TAB_ID) return [];
    const grid: CalculationResult[] = [];
    const points: { x: number, y: number, z: number, nx: number, ny: number, nz: number, type: any }[] = [];
    
    if (calcMode === 'FLOOR') {
      const stepX = room.width / GRID_RESOLUTION;
      const stepZ = room.depth / GRID_RESOLUTION;
      for (let i = 0; i < GRID_RESOLUTION; i++) {
        for (let j = 0; j < GRID_RESOLUTION; j++) {
          points.push({ x: (i + 0.5) * stepX, y: room.workPlaneHeight, z: (j + 0.5) * stepZ, nx: 0, ny: 1, nz: 0, type: 'FLOOR' });
        }
      }
    } else {
      const centerX = room.width / 2;
      const centerZ = room.depth / 2;
      const stepX = room.bodyWidth / GRID_RESOLUTION;
      const stepZ = room.bodyLength / GRID_RESOLUTION;
      for (let i = 0; i < GRID_RESOLUTION; i++) {
        for (let j = 0; j < GRID_RESOLUTION; j++) {
          points.push({ x: centerX - room.bodyWidth/2 + (i+0.5) * stepX, y: room.bodyClearance + room.bodyHeight, z: centerZ - room.bodyLength/2 + (j+0.5) * stepZ, nx: 0, ny: 1, nz: 0, type: 'BODY_TOP' });
        }
      }
      const stepY = room.bodyHeight / GRID_RESOLUTION;
      for (let i = 0; i < GRID_RESOLUTION; i++) {
        for (let j = 0; j < GRID_RESOLUTION; j++) {
          points.push({ x: centerX - room.bodyWidth/2, y: room.bodyClearance + (i+0.5) * stepY, z: centerZ - room.bodyLength/2 + (j+0.5) * stepZ, nx: -1, ny: 0, nz: 0, type: 'BODY_SIDE' });
        }
      }
    }

    points.forEach(p => {
      let totalLux = 0;
      lights.forEach(light => {
        getExpandedLights(light, room).forEach(inst => {
          const dx = inst.x - p.x; const dy = inst.y - p.y; const dz = inst.z - p.z;
          const distSq = dx * dx + dy * dy + dz * dz; const dist = Math.sqrt(distSq);
          if (dist < 0.05) return;
          const lx = dx / dist; const ly = dy / dist; const lz = dz / dist;
          const cosTheta = Math.max(0, lx * p.nx + ly * p.ny + lz * p.nz);
          const intensity = light.lumens / (4 * Math.PI);
          totalLux += (intensity * cosTheta) / distSq;
        });
      });
      grid.push({ ...p, lux: totalLux * 10, surfaceType: p.type });
    });
    return grid;
  }, [room, lights, calcMode, activeProjectId]);

  const stats = useMemo(() => {
    if (results.length === 0) return { main: 0, top: 0, side: 0, peak: 0 };
    const main = d3.mean(results, d => d.lux) || 0;
    const top = d3.mean(results.filter(r => r.surfaceType === 'BODY_TOP'), d => d.lux) || 0;
    const side = d3.mean(results.filter(r => r.surfaceType === 'BODY_SIDE'), d => d.lux) || 0;
    const peak = d3.max(results, d => d.lux) || 0;
    return { main, top, side, peak };
  }, [results]);

  const colorScale = useMemo(() => 
    d3.scaleLinear<string>()
      .domain(COLOR_STOPS.map(s => s.pos * Math.max(10, stats.peak)))
      .range(COLOR_STOPS.map(s => s.color))
      .interpolate(d3.interpolateRgb)
  , [stats.peak]);

  useEffect(() => {
    if (!planSvgRef.current || planDims.width === 0 || activeProjectId === INFO_TAB_ID) return;
    const svg = d3.select(planSvgRef.current);
    svg.selectAll("*").remove();
    const margin = 50;
    const availW = planDims.width - margin * 2;
    const availH = planDims.height - margin * 2;
    const scale = Math.min(availW / room.width, availH / room.depth);
    const w = room.width * scale;
    const h = room.depth * scale;
    const g = svg.append("g").attr("transform", `translate(${(planDims.width - w) / 2}, ${(planDims.height - h) / 2})`);
    const xScale = d3.scaleLinear().domain([0, room.width]).range([0, w]);
    const zScale = d3.scaleLinear().domain([0, room.depth]).range([h, 0]);
    g.append("rect").attr("width", w).attr("height", h).attr("fill", "#0f172a").attr("stroke", "#334155").attr("stroke-width", 2);
    const stepX = room.width / GRID_RESOLUTION * scale;
    const stepZ = room.depth / GRID_RESOLUTION * scale;
    if (calcMode === 'FLOOR') {
      results.forEach(p => {
        g.append("rect").attr("x", xScale(p.x - room.width / GRID_RESOLUTION / 2)).attr("y", zScale(p.z + room.depth / GRID_RESOLUTION / 2)).attr("width", stepX + 0.5).attr("height", stepZ + 0.5).attr("fill", colorScale(p.lux)).attr("cursor", "crosshair").on("mouseenter", (e) => setHoverInfo({ x: e.clientX, y: e.clientY, lux: p.lux, label: `X: ${p.x.toFixed(1)}m, Z: ${p.z.toFixed(1)}m` })).on("mousemove", (e) => setHoverInfo(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)).on("mouseleave", () => setHoverInfo(null));
      });
    } else {
      results.filter(r => r.surfaceType === 'BODY_TOP').forEach(p => {
        const sw = room.bodyWidth / GRID_RESOLUTION * scale;
        const sh = room.bodyLength / GRID_RESOLUTION * scale;
        g.append("rect").attr("x", xScale(p.x - room.bodyWidth / GRID_RESOLUTION / 2)).attr("y", zScale(p.z + room.bodyLength / GRID_RESOLUTION / 2)).attr("width", sw + 0.5).attr("height", sh + 0.5).attr("fill", colorScale(p.lux)).attr("cursor", "crosshair").on("mouseenter", (e) => setHoverInfo({ x: e.clientX, y: e.clientY, lux: p.lux, label: `Body X: ${p.x.toFixed(1)}m, Z: ${p.z.toFixed(1)}m` })).on("mousemove", (e) => setHoverInfo(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)).on("mouseleave", () => setHoverInfo(null));
      });
      g.append("rect").attr("x", xScale(room.width/2 - room.bodyWidth/2)).attr("y", zScale(room.depth/2 + room.bodyLength/2)).attr("width", room.bodyWidth * scale).attr("height", room.bodyLength * scale).attr("fill", "none").attr("stroke", "#fbbf24").attr("stroke-width", 2);
    }
    lights.forEach(light => {
      getExpandedLights(light, room).forEach(pos => {
        g.append("circle").attr("cx", xScale(pos.x)).attr("cy", zScale(pos.z)).attr("r", 4).attr("fill", light.color).attr("stroke", "#fff").attr("stroke-width", 1.5).attr("filter", "drop-shadow(0 0 4px rgba(255,255,255,0.5))");
      });
    });
    const labelStyle = "font-size: 10px; font-weight: 900; fill: #64748b; text-anchor: middle; text-transform: uppercase;";
    g.append("text").attr("x", w/2).attr("y", -15).attr("style", labelStyle).text("NORTH (Depth+)");
    g.append("text").attr("x", w/2).attr("y", h + 25).attr("style", labelStyle).text("SOUTH (Depth-)");
    g.append("text").attr("x", -25).attr("y", h/2).attr("style", labelStyle).attr("transform", `rotate(-90, -25, ${h/2})`).text("WEST");
    g.append("text").attr("x", w + 25).attr("y", h/2).attr("style", labelStyle).attr("transform", `rotate(90, ${w+25}, ${h/2})`).text("EAST");
  }, [results, room, lights, calcMode, planDims, activeProjectId, colorScale]);

  useEffect(() => {
    if (!sectionSvgRef.current || sectionDims.width === 0 || activeProjectId === INFO_TAB_ID) return;
    const svg = d3.select(sectionSvgRef.current);
    svg.selectAll("*").remove();
    const margin = 50;
    const availW = sectionDims.width - margin * 2;
    const availH = sectionDims.height - margin * 2;
    const scale = Math.min(availW / room.width, availH / room.height);
    const w = room.width * scale;
    const h = room.height * scale;
    const g = svg.append("g").attr("transform", `translate(${(sectionDims.width - w) / 2}, ${(sectionDims.height - h) / 2})`);
    const xScale = d3.scaleLinear().domain([0, room.width]).range([0, w]);
    const yScale = d3.scaleLinear().domain([0, room.height]).range([h, 0]);
    const path = d3.path();
    path.moveTo(xScale(0), yScale(0));
    path.lineTo(xScale(room.width), yScale(0));
    path.lineTo(xScale(room.width), yScale(room.height - room.chamfer));
    path.lineTo(xScale(room.width - room.chamfer), yScale(room.height));
    path.lineTo(xScale(room.chamfer), yScale(room.height));
    path.lineTo(xScale(0), yScale(room.height - room.chamfer));
    path.closePath();
    g.append("path").attr("d", path.toString()).attr("fill", "#0f172a").attr("stroke", "#475569").attr("stroke-width", 2);
    if (calcMode === 'FLOOR') {
      const stepX = room.width / GRID_RESOLUTION * scale;
      d3.group(results, d => Math.round(d.x * 100) / 100).forEach((group, x) => {
        const avg = d3.mean(group, d => d.lux) || 0;
        g.append("rect").attr("x", xScale(Number(x) - room.width / GRID_RESOLUTION / 2)).attr("y", yScale(room.workPlaneHeight) - 5).attr("width", stepX + 0.5).attr("height", 10).attr("fill", colorScale(avg)).attr("opacity", 0.7).attr("cursor", "crosshair").on("mouseenter", (e) => setHoverInfo({ x: e.clientX, y: e.clientY, lux: avg, label: `Avg Lux at X: ${Number(x).toFixed(1)}m` })).on("mousemove", (e) => setHoverInfo(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)).on("mouseleave", () => setHoverInfo(null));
      });
      g.append("line").attr("x1", 0).attr("x2", w).attr("y1", yScale(room.workPlaneHeight)).attr("y2", yScale(room.workPlaneHeight)).attr("stroke", "#fbbf24").attr("stroke-dasharray", "4").attr("opacity", 0.5);
    } else {
      const sideGroup = results.filter(r => r.surfaceType === 'BODY_SIDE');
      const stepY = room.bodyHeight / GRID_RESOLUTION * scale;
      d3.group(sideGroup, d => Math.round(d.y * 100) / 100).forEach((group, y) => {
        const avg = d3.mean(group, d => d.lux) || 0;
        g.append("rect").attr("x", xScale(room.width/2 - room.bodyWidth/2) - 15).attr("y", yScale(Number(y) + room.bodyHeight / GRID_RESOLUTION / 2)).attr("width", 15).attr("height", stepY + 0.5).attr("fill", colorScale(avg)).attr("cursor", "crosshair").on("mouseenter", (e) => setHoverInfo({ x: e.clientX, y: e.clientY, lux: avg, label: `Side Avg at H: ${Number(y).toFixed(1)}m` })).on("mousemove", (e) => setHoverInfo(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)).on("mouseleave", () => setHoverInfo(null));
      });
      g.append("rect").attr("x", xScale(room.width/2 - room.bodyWidth/2)).attr("y", yScale(room.bodyClearance + room.bodyHeight)).attr("width", room.bodyWidth * scale).attr("height", room.bodyHeight * scale).attr("fill", "#1e293b").attr("stroke", "#fbbf24").attr("stroke-width", 2);
    }
    lights.forEach(light => {
      getExpandedLights(light, room).forEach(pos => {
        g.append("circle").attr("cx", xScale(pos.x)).attr("cy", yScale(pos.y)).attr("r", 4).attr("fill", light.color).attr("stroke", "#fff").attr("stroke-width", 1.5);
      });
    });
  }, [results, room, lights, calcMode, sectionDims, activeProjectId, colorScale]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <nav className="flex items-center gap-1 px-4 pt-3 bg-slate-950/50 border-b border-slate-800 shrink-0 overflow-hidden h-[52px]">
        <div className="flex items-center gap-2 mr-6 text-amber-500 pb-2">
          <Sun size={18} className="animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">{t.appTitle}</span>
        </div>
        <div className="flex flex-1 items-end gap-1 overflow-x-auto overflow-y-hidden no-scrollbar h-full">
          <div onClick={() => setActiveProjectId(INFO_TAB_ID)} className={`group relative flex items-center h-10 px-4 gap-2 cursor-pointer rounded-t-xl transition-all duration-200 min-w-[140px] border-t border-x border-transparent ${activeProjectId === INFO_TAB_ID ? 'bg-slate-800 text-white shadow-lg border-slate-700' : 'bg-slate-900/40 text-slate-500 hover:bg-slate-800/50'}`}>
            <BookOpen size={14} className={activeProjectId === INFO_TAB_ID ? 'text-amber-500' : 'text-slate-600'} />
            <span className="text-[10px] font-black uppercase tracking-widest truncate flex-1">{t.techRef}</span>
            {activeProjectId === INFO_TAB_ID && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
          </div>
          {projects.map((p, index) => (
            <div key={p.id} draggable onDragStart={(e) => onDragStart(e, index)} onDragOver={(e) => onDragOver(e, index)} onDragEnd={onDragEnd} onClick={() => setActiveProjectId(p.id)} className={`group relative flex items-center h-10 px-4 gap-3 cursor-pointer rounded-t-xl transition-all duration-200 min-w-[140px] ${activeProjectId === p.id ? 'bg-slate-800 text-white shadow-lg border-x border-t border-slate-700' : 'bg-slate-900/40 text-slate-500 hover:bg-slate-800/50'}`}>
              <div className="cursor-grab active:cursor-grabbing text-slate-700 group-hover:text-slate-500 shrink-0"><GripVertical size={10} /></div>
              {editingProjectId === p.id ? (
                <input type="text" autoFocus className="bg-slate-950 border border-amber-500/50 rounded px-1 py-0.5 text-xs text-white outline-none w-full" defaultValue={p.name} onBlur={(e) => updateProjectName(p.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') updateProjectName(p.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingProjectId(null); }} onClick={(e) => e.stopPropagation()} />
              ) : (
                <span className="text-xs font-bold truncate flex-1" onDoubleClick={(e) => { e.stopPropagation(); setEditingProjectId(p.id); }} title={t.doubleClick}>{p.name}</span>
              )}
              <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className={`ml-2 p-1 rounded-md transition-all duration-200 ${projects.length <= 1 ? 'opacity-20 cursor-not-allowed' : 'text-slate-500 hover:text-rose-500 hover:bg-slate-700/50'}`} title={t.deleteProj} disabled={projects.length <= 1}><Trash2 size={12} /></button>
              {activeProjectId === p.id && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
            </div>
          ))}
          <button onClick={() => { const id = `proj-${Date.now()}`; setProjects([...projects, { id, name: `Project ${projects.length+1}`, room: {...DEFAULT_ROOM}, lights: [], calcMode: 'FLOOR' }]); setActiveProjectId(id); }} className="flex items-center justify-center h-8 w-8 mb-1 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-amber-500 hover:text-white transition-all shadow-sm shrink-0"><Plus size={16} /></button>
        </div>
        <div className="flex items-center gap-2 px-4 pb-2">
          {/* Language Selector */}
          <div className="relative group/lang">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'ja' | 'en')}
              className="appearance-none bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 pr-8 rounded-lg text-[10px] font-black uppercase tracking-tighter outline-none cursor-pointer transition-all"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
            <Languages size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
          </div>

          <button onClick={() => { 
            const data = JSON.stringify(projects, null, 2); 
            const blob = new Blob([data], { type: 'application/json' }); 
            const url = URL.createObjectURL(blob); 
            const a = document.createElement('a'); 
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            a.href = url; 
            a.download = `LuxCal_${dateStr}.json`; 
            a.click(); 
          }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-tighter border border-slate-700"><Download size={12} /> <span className="hidden sm:inline">{t.export}</span></button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-tighter border border-slate-700"><Upload size={12} /> <span className="hidden sm:inline">{t.import}</span></button>
          <input type="file" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { try { const d = JSON.parse(ev.target?.result as string); setProjects(d); if (d.length > 0) setActiveProjectId(d[0].id); } catch(e) { alert('Invalid file'); } }; reader.readAsText(file); }} accept=".json" className="hidden" />
        </div>
      </nav>

      {activeProjectId === INFO_TAB_ID ? <TechnicalReference t={t} /> : (
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-full lg:w-96 bg-slate-800 border-r border-slate-700 flex flex-col shadow-2xl overflow-y-auto z-20">
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
                <button onClick={() => setCalcMode('FLOOR')} className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${calcMode === 'FLOOR' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Layout size={14} /> {t.floorPlan}</button>
                <button onClick={() => setCalcMode('BODY')} className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${calcMode === 'BODY' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Box size={14} /> {t.bodyInsp}</button>
              </div>

              <section className="space-y-4">
                <div className="text-[10px] font-black text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2 flex items-center gap-2"><Settings size={12} className="text-slate-400" /> {t.roomGeometry}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 bg-slate-700/20 p-4 rounded-2xl border border-slate-700">
                  <div className="space-y-1"><label className="text-[9px] text-slate-300 font-bold uppercase">{t.width}</label><input type="number" step="0.1" value={room.width} onChange={e => setRoom({...room, width: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none" /></div>
                  <div className="space-y-1"><label className="text-[9px] text-slate-300 font-bold uppercase">{t.length}</label><input type="number" step="0.1" value={room.depth} onChange={e => setRoom({...room, depth: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none" /></div>
                  <div className="space-y-1"><label className="text-[9px] text-slate-300 font-bold uppercase">{t.height}</label><input type="number" step="0.1" value={room.height} onChange={e => setRoom({...room, height: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none" /></div>
                  <div className="space-y-1"><label className="text-[9px] text-amber-500 font-black uppercase">{t.slope}</label><input type="number" step="0.1" value={room.chamfer} onChange={e => setRoom({...room, chamfer: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none" /></div>
                </div>
              </section>

              {calcMode === 'FLOOR' && (
                <section className="space-y-4">
                  <div className="text-[10px] font-black text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2 flex items-center gap-2"><Ruler size={12} className="text-slate-400" /> {t.measurementPlane}</div>
                  <div className="bg-slate-700/20 p-4 rounded-2xl border border-slate-700 space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-amber-500 uppercase">{t.planeHeight}</label>
                      <input type="number" step="0.01" value={room.workPlaneHeight} onChange={e => setRoom({...room, workPlaneHeight: Number(e.target.value)})} className="w-16 bg-slate-900 border border-slate-600 rounded text-right text-[10px] p-1 outline-none font-mono text-amber-400" />
                    </div>
                    <input type="range" min="0" max={room.height} step="0.1" value={room.workPlaneHeight} onChange={e => setRoom({...room, workPlaneHeight: Number(e.target.value)})} className="w-full h-1 accent-amber-500 appearance-none bg-slate-600 rounded-full" />
                  </div>
                </section>
              )}

              {calcMode === 'BODY' && (
                <section className="space-y-4">
                  <div className="text-[10px] font-black text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2 flex items-center gap-2"><Box size={12} className="text-slate-400" /> {t.bodyGeometry}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 bg-slate-700/20 p-4 rounded-2xl border border-slate-700">
                    <div className="space-y-1"><label className="text-[9px] text-slate-300 font-bold uppercase">{t.bodyWidth}</label><input type="number" step="0.1" value={room.bodyWidth} onChange={e => setRoom({...room, bodyWidth: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none" /></div>
                    <div className="space-y-1"><label className="text-[9px] text-slate-300 font-bold uppercase">{t.bodyLength}</label><input type="number" step="0.1" value={room.bodyLength} onChange={e => setRoom({...room, bodyLength: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none" /></div>
                    <div className="space-y-1"><label className="text-[9px] text-slate-300 font-bold uppercase">{t.bodyHeight}</label><input type="number" step="0.1" value={room.bodyHeight} onChange={e => setRoom({...room, bodyHeight: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none" /></div>
                    <div className="space-y-1"><label className="text-[9px] text-amber-500 uppercase font-black">{t.clearance}</label><input type="number" step="0.1" value={room.bodyClearance} onChange={e => setRoom({...room, bodyClearance: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none font-bold" /></div>
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-2">
                  <span>{t.lights} ({lights.length} Types / {totalLightPoints} {t.pts})</span>
                  <button onClick={() => setLights([...lights, { id: Math.random().toString(36).substr(2, 9), name: `L`, surface: SurfaceType.CEILING, u: 0.5, v: 0.5, lumens: 4000, color: '#facc15', pitch: 0 }])} className="bg-amber-500 p-1.5 rounded-full hover:bg-amber-400 transition-colors shadow-lg"><Plus size={14} className="text-slate-900" /></button>
                </div>
                {lights.map(light => (
                  <div key={light.id} className="bg-slate-700/40 p-4 rounded-2xl border border-slate-600/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <select value={light.surface} onChange={e => setLights(lights.map(l => l.id === light.id ? { ...l, surface: e.target.value as SurfaceType } : l))} className="bg-transparent border-none text-[10px] font-black text-slate-200 uppercase outline-none">
                        {Object.values(SurfaceType).map(s => <option key={s} value={s} className="bg-slate-800 text-white">{s}</option>)}
                      </select>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setLights([...lights, { ...light, id: Math.random().toString(36).substr(2, 9), name: `${light.name} (Copy)` }])} className="text-slate-400 hover:text-amber-500 transition-colors"><Copy size={12} /></button>
                        <button onClick={() => setLights(lights.filter(l => l.id !== light.id))} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-slate-300 uppercase">U</label><input type="number" step="0.01" value={light.u} onChange={e => setLights(lights.map(l => l.id === light.id ? { ...l, u: Math.max(0, Math.min(1, Number(e.target.value))) } : l))} className="w-10 bg-slate-900 border border-slate-600 rounded text-right text-[9px] p-0.5 outline-none font-mono text-amber-400" /></div>
                        <input type="range" min="0" max="1" step="0.01" value={light.u} onChange={e => setLights(lights.map(l => l.id === light.id ? { ...l, u: Number(e.target.value) } : l))} className="w-full h-1 accent-amber-500 appearance-none bg-slate-600 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><label className="text-[8px] font-bold text-slate-300 uppercase">V</label><input type="number" step="0.01" value={light.v} onChange={e => setLights(lights.map(l => l.id === light.id ? { ...l, v: Math.max(0, Math.min(1, Number(e.target.value))) } : l))} className="w-10 bg-slate-900 border border-slate-600 rounded text-right text-[9px] p-0.5 outline-none font-mono text-amber-400" /></div>
                        <input type="range" min="0" max="1" step="0.01" value={light.v} onChange={e => setLights(lights.map(l => l.id === light.id ? { ...l, v: Number(e.target.value) } : l))} className="w-full h-1 accent-amber-500 appearance-none bg-slate-600 rounded-full" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><label className="text-[8px] text-slate-300 font-bold uppercase">{t.pitch}</label><input type="number" step="0.1" value={light.pitch} onChange={e => setLights(lights.map(l => l.id === light.id ? { ...l, pitch: Number(e.target.value) } : l))} className="w-full bg-slate-900 border border-slate-600 rounded px-1 py-1 text-right text-[10px] outline-none font-mono text-amber-400" /></div>
                      <div className="space-y-1"><label className="text-[8px] text-slate-300 font-bold uppercase">{t.lumens}</label><input type="number" step="100" value={light.lumens} onChange={e => setLights(lights.map(l => l.id === light.id ? { ...l, lumens: Number(e.target.value) } : l))} className="w-full bg-slate-900 border border-slate-600 rounded px-1 py-1 text-right text-[10px] outline-none font-mono text-amber-400" /></div>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          </aside>

          <main className="flex-1 flex flex-col p-4 relative bg-slate-900 overflow-hidden">
            <header className="flex justify-between items-end mb-4 px-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-2xl shadow-lg"><Split size={20} className="text-slate-900" /></div>
                <div>
                  <h2 className="text-xl font-black tracking-tighter">{activeProject.name} {t.analysis}</h2>
                  <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">{t.realtimeVis}</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
                  <Zap size={12} className="text-amber-400 fill-amber-400" />
                  <div className="flex flex-col leading-none">
                    <span className="text-[7px] uppercase text-slate-400 font-black">{t.totalLights}</span>
                    <span className="text-sm font-mono font-black text-amber-400">{totalLightPoints}</span>
                  </div>
                </div>
                <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 flex flex-col items-center min-w-[160px]">
                  <span className="text-[8px] uppercase text-slate-400 font-black mb-1">{t.avgLabel} {calcMode === 'FLOOR' ? t.workPlane : t.bodySurface} ({calcMode === 'FLOOR' ? room.workPlaneHeight : room.bodyClearance + room.bodyHeight}m)</span>
                  <span className="text-2xl font-mono text-amber-400 font-black">{stats.main.toFixed(0)} <span className="text-[10px] font-normal opacity-50">lx</span></span>
                </div>
              </div>
            </header>

            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div ref={planContainerRef} className="bg-slate-950 rounded-[2rem] border-2 border-slate-800 shadow-inner relative flex flex-col overflow-hidden">
                <div className="absolute top-6 left-8 flex items-center gap-2 z-10"><div className="w-1.5 h-4 bg-amber-500 rounded-full"></div><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{calcMode === 'FLOOR' ? t.floorTopView : t.bodyTopView}</span></div>
                <div className="flex-1 relative flex items-center justify-center">
                  <svg ref={planSvgRef} className="w-full h-full pointer-events-auto" />
                </div>
              </div>
              <div ref={sectionContainerRef} className="bg-slate-950 rounded-[2rem] border-2 border-slate-800 shadow-inner relative flex flex-col overflow-hidden">
                <div className="absolute top-6 left-8 flex items-center gap-2 z-10"><div className="w-1.5 h-4 bg-blue-500 rounded-full"></div><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.sectionView}</span></div>
                <div className="flex-1 relative flex items-center justify-center">
                  <svg ref={sectionSvgRef} className="w-full h-full pointer-events-auto" />
                </div>
              </div>
            </div>

            {hoverInfo && (
              <div className="fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-[calc(100%+12px)] transition-all duration-75" style={{ left: hoverInfo.x, top: hoverInfo.y }}>
                <div className="bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-amber-500/50 shadow-2xl flex flex-col items-center">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{hoverInfo.label}</div>
                  <div className="text-2xl font-black font-mono text-amber-400">{hoverInfo.lux.toFixed(0)} <span className="text-xs font-normal opacity-60">lx</span></div>
                  <div className="w-3 h-3 bg-slate-900 border-r border-b border-amber-500/50 rotate-45 -mb-4 mt-2"></div>
                </div>
              </div>
            )}

            {showGuide && (
              <div className="absolute bottom-8 right-8 w-[300px] z-30">
                <div className="bg-slate-900/90 backdrop-blur-xl px-6 py-4 rounded-3xl border border-slate-700 shadow-2xl space-y-2">
                  <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest"><span>0 lx</span><span>{t.peak}: {stats.peak.toFixed(0)} lx</span></div>
                  <div className="w-full h-2 rounded-full bg-[linear-gradient(to_right,#0f172a,#991b1b,#ea580c,#facc15,#ffffff)] border border-slate-800"></div>
                  <button onClick={() => setShowGuide(false)} className="absolute -top-2 -right-2 bg-slate-800 p-1 rounded-full border border-slate-700 hover:text-white transition-all"><X size={10} /></button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
