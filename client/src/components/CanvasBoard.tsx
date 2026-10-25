import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StrokeData } from '../types';
import { socket } from '../services/socket';
import { soundManager } from '../services/sound';
import { HotkeyConfig, getHotkeys } from '../services/hotkeys';
import {
  Paintbrush,
  Eraser,
  PaintBucket,
  RotateCcw,
  Trash2,
  Download,
  ArrowLeftRight,
} from 'lucide-react';

interface CanvasBoardProps {
  isDrawer: boolean;
  drawerName?: string;
  strokes: StrokeData[];
  onStrokesChange?: (strokes: StrokeData[]) => void;
}

export const SKRIBBL_PALETTE = [
  // Row 1
  '#ffffff', '#c1c1c1', '#ef130b', '#ff7100', '#ffe400', '#00cc00', '#00b2ff', '#231fd3', '#a300ba', '#d37caa', '#a0522d',
  // Row 2
  '#000000', '#4c4c4c', '#740b07', '#c23800', '#e8a200', '#005510', '#00569e', '#0e0865', '#550069', '#a75574', '#63300d',
];

export const SKRIBBL_BRUSH_SIZES = [4, 10, 20, 36];

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  isDrawer,
  drawerName,
  strokes,
  onStrokesChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [previousColor, setPreviousColor] = useState<string>('#ffffff');
  const [currentSize, setCurrentSize] = useState<number>(10);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hotkeys, setHotkeys] = useState<HotkeyConfig>(getHotkeys);

  const activeRemoteStrokeRef = useRef<{
    tool: 'pen' | 'eraser' | 'fill';
    color: string;
    size: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  const redrawAllStrokes = useCallback((strokesList: StrokeData[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokesList.forEach(stroke => {
      if (stroke.tool === 'fill' && stroke.points.length > 0) {
        floodFill(
          ctx,
          Math.round(stroke.points[0].x * canvas.width),
          Math.round(stroke.points[0].y * canvas.height),
          hexToRgba(stroke.color)
        );
        return;
      }

      if (stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
      ctx.lineWidth = stroke.size;

      const firstPt = stroke.points[0];
      ctx.moveTo(firstPt.x * canvas.width, firstPt.y * canvas.height);

      if (stroke.points.length === 1) {
        ctx.lineTo(firstPt.x * canvas.width + 0.1, firstPt.y * canvas.height + 0.1);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        }
      }
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    redrawAllStrokes(strokes);
  }, [strokes, redrawAllStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const targetWidth = Math.floor(rect.width);
      const targetHeight = Math.floor(rect.height);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        redrawAllStrokes(strokes);
      }
    };

    updateCanvasSize();
    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [strokes, redrawAllStrokes]);

  const hexToRgba = (hex: string): [number, number, number, number] => {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
  };

  const floodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColor: [number, number, number, number]
  ) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const startIndex = (startY * width + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    if (
      targetR === fillColor[0] &&
      targetG === fillColor[1] &&
      targetB === fillColor[2] &&
      targetA === fillColor[3]
    ) {
      return;
    }

    const matchesTarget = (idx: number) => {
      const dr = Math.abs(data[idx] - targetR);
      const dg = Math.abs(data[idx + 1] - targetG);
      const db = Math.abs(data[idx + 2] - targetB);
      return dr < 32 && dg < 32 && db < 32;
    };

    const pixelStack: [number, number][] = [[startX, startY]];

    while (pixelStack.length > 0) {
      const popItem = pixelStack.pop();
      if (!popItem) continue;
      let [x, y] = popItem;

      let pixelPos = (y * width + x) * 4;
      while (y >= 0 && matchesTarget(pixelPos)) {
        y--;
        pixelPos -= width * 4;
      }
      pixelPos += width * 4;
      y++;

      let reachLeft = false;
      let reachRight = false;

      while (y < height && matchesTarget(pixelPos)) {
        data[pixelPos] = fillColor[0];
        data[pixelPos + 1] = fillColor[1];
        data[pixelPos + 2] = fillColor[2];
        data[pixelPos + 3] = fillColor[3];

        if (x > 0) {
          if (matchesTarget(pixelPos - 4)) {
            if (!reachLeft) {
              pixelStack.push([x - 1, y]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (x < width - 1) {
          if (matchesTarget(pixelPos + 4)) {
            if (!reachRight) {
              pixelStack.push([x + 1, y]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        y++;
        pixelPos += width * 4;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    const handleRemoteDrawStart = (data: {
      id: string;
      x: number;
      y: number;
      color: string;
      size: number;
      tool: 'pen' | 'eraser' | 'fill';
    }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      activeRemoteStrokeRef.current = {
        tool: data.tool,
        color: data.color,
        size: data.size,
        lastX: data.x * canvas.width,
        lastY: data.y * canvas.height,
      };

      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
      ctx.lineWidth = data.size;
      ctx.moveTo(data.x * canvas.width, data.y * canvas.height);
      ctx.lineTo(data.x * canvas.width + 0.1, data.y * canvas.height + 0.1);
      ctx.stroke();
    };

    const handleRemoteDrawMove = (data: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const remote = activeRemoteStrokeRef.current;
      if (!ctx || !remote) return;

      const currentX = data.x * canvas.width;
      const currentY = data.y * canvas.height;

      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = remote.tool === 'eraser' ? '#ffffff' : remote.color;
      ctx.lineWidth = remote.size;
      ctx.moveTo(remote.lastX, remote.lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      remote.lastX = currentX;
      remote.lastY = currentY;
    };

    const handleRemoteDrawEnd = () => {
      activeRemoteStrokeRef.current = null;
    };

    const handleRemoteCanvasClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (onStrokesChange) onStrokesChange([]);
    };

    const handleRemoteDrawUndo = (data: { strokes: StrokeData[] }) => {
      if (onStrokesChange) onStrokesChange(data.strokes);
      redrawAllStrokes(data.strokes);
    };

    const handleRemoteDrawFill = (data: { x: number; y: number; color: string }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      floodFill(
        ctx,
        Math.round(data.x * canvas.width),
        Math.round(data.y * canvas.height),
        hexToRgba(data.color)
      );
    };

    socket.on('draw_start', handleRemoteDrawStart);
    socket.on('draw_move', handleRemoteDrawMove);
    socket.on('draw_end', handleRemoteDrawEnd);
    socket.on('canvas_clear', handleRemoteCanvasClear);
    socket.on('draw_undo', handleRemoteDrawUndo);
    socket.on('draw_fill', handleRemoteDrawFill);

    return () => {
      socket.off('draw_start', handleRemoteDrawStart);
      socket.off('draw_move', handleRemoteDrawMove);
      socket.off('draw_end', handleRemoteDrawEnd);
      socket.off('canvas_clear', handleRemoteCanvasClear);
      socket.off('draw_undo', handleRemoteDrawUndo);
      socket.off('draw_fill', handleRemoteDrawFill);
    };
  }, [onStrokesChange, redrawAllStrokes]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x: normX, y: normY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'fill') {
      soundManager.playPop();
      floodFill(
        ctx,
        Math.round(coords.x * canvas.width),
        Math.round(coords.y * canvas.height),
        hexToRgba(currentColor)
      );
      socket.emit('draw_fill', { x: coords.x, y: coords.y, color: currentColor });
      return;
    }

    setIsDrawing(true);

    const pxX = coords.x * canvas.width;
    const pxY = coords.y * canvas.height;

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : currentColor;
    ctx.lineWidth = currentSize;
    ctx.moveTo(pxX, pxY);
    ctx.lineTo(pxX + 0.1, pxY + 0.1);
    ctx.stroke();

    socket.emit('draw_start', {
      x: coords.x,
      y: coords.y,
      color: currentColor,
      size: currentSize,
      tool,
    });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pxX = coords.x * canvas.width;
    const pxY = coords.y * canvas.height;

    ctx.lineTo(pxX, pxY);
    ctx.stroke();

    socket.emit('draw_move', { x: coords.x, y: coords.y });
  };

  const stopDrawing = () => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);
    socket.emit('draw_end', {});
  };

  const handleClear = useCallback(() => {
    if (!isDrawer) return;
    soundManager.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    socket.emit('canvas_clear', {});
  }, [isDrawer]);

  const handleUndo = useCallback(() => {
    if (!isDrawer) return;
    soundManager.playPop();
    socket.emit('draw_undo', {});
  }, [isDrawer]);

  const handleSwap = useCallback(() => {
    soundManager.playPop();
    setCurrentColor(curr => {
      setPreviousColor(curr);
      return previousColor;
    });
    if (tool === 'eraser') {
      setTool('pen');
    }
  }, [previousColor, tool]);

  const handleColorSelect = (c: string) => {
    soundManager.playPop();
    if (c !== currentColor) {
      setPreviousColor(currentColor);
      setCurrentColor(c);
    }
    if (tool === 'eraser') setTool('pen');
  };

  // Listen for hotkeys configuration changes
  useEffect(() => {
    const handleHotkeysChanged = (e: any) => {
      if (e.detail) {
        setHotkeys(e.detail);
      } else {
        setHotkeys(getHotkeys());
      }
    };
    window.addEventListener('skribbl_hotkeys_changed', handleHotkeysChanged);
    return () => {
      window.removeEventListener('skribbl_hotkeys_changed', handleHotkeysChanged);
    };
  }, []);

  // Hotkey keyboard event handler
  useEffect(() => {
    if (!isDrawer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tag = activeEl.tagName.toLowerCase();
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          (activeEl as HTMLElement).isContentEditable
        ) {
          return;
        }
      }

      // Check if any modal is currently visible
      if (document.querySelector('.modal-backdrop')) {
        return;
      }

      // Standard Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ignore when modifier keys are held
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      let key = e.key.toUpperCase();
      if (key === ' ') key = 'SPACE';

      if (key === hotkeys.brush) {
        e.preventDefault();
        soundManager.playPop();
        setTool('pen');
      } else if (key === hotkeys.fill) {
        e.preventDefault();
        soundManager.playPop();
        setTool('fill');
      } else if (key === hotkeys.undo) {
        e.preventDefault();
        handleUndo();
      } else if (key === hotkeys.clear) {
        e.preventDefault();
        handleClear();
      } else if (key === hotkeys.swap) {
        e.preventDefault();
        handleSwap();
      } else if (key === 'E') {
        // Eraser quick-key if E isn't bound to something else
        if (![hotkeys.brush, hotkeys.fill, hotkeys.undo, hotkeys.clear, hotkeys.swap].includes('E')) {
          e.preventDefault();
          soundManager.playPop();
          setTool('eraser');
        }
      } else if (['1', '2', '3', '4'].includes(key)) {
        // Quick brush size selection via 1-4
        const idx = parseInt(key, 10) - 1;
        if (SKRIBBL_BRUSH_SIZES[idx]) {
          e.preventDefault();
          soundManager.playPop();
          setCurrentSize(SKRIBBL_BRUSH_SIZES[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawer, hotkeys, handleUndo, handleClear, handleSwap]);

  const handleDownload = () => {
    soundManager.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `skribbl-drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Reactions (Screenshot 3: Thumbs Up 👍 & Thumbs Down 👎)
  const handleReaction = (reaction: 'like' | 'dislike') => {
    soundManager.playPop();
    socket.emit('guess', {
      text: reaction === 'like' ? '👍 liked the drawing!' : '👎 disliked the drawing!',
    });
  };

  return (
    <div className="skribbl-canvas-outer-card">
      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="skribbl-canvas-viewport relative"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ cursor: isDrawer ? (tool === 'fill' ? 'cell' : 'crosshair') : 'default' }}
        />

        {/* Thumbs Up / Down Reactions matching Screenshot 3 */}
        {!isDrawer && (
          <div className="skribbl-reactions-overlay">
            <button
              type="button"
              onClick={() => handleReaction('like')}
              className="reaction-thumb-btn like-btn"
              title="Like this drawing"
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => handleReaction('dislike')}
              className="reaction-thumb-btn dislike-btn"
              title="Dislike this drawing"
            >
              👎
            </button>
          </div>
        )}
      </div>

      {/* Classic Skribbl Drawer Bottom Bar (when drawing) */}
      {isDrawer && (
        <div className="skribbl-bottom-drawing-bar">
          {/* Color Preview & Swap Control */}
          <div className="flex items-center gap-1">
            <div
              className="skribbl-active-color-box cursor-pointer"
              style={{ backgroundColor: tool === 'eraser' ? '#ffffff' : currentColor }}
              onClick={handleSwap}
              title={`Active color. Click or press [${hotkeys.swap}] to swap with previous color (${previousColor})`}
            />
            <button
              type="button"
              className="skribbl-tool-icon-btn p-1"
              style={{ width: '28px', height: '28px' }}
              onClick={handleSwap}
              title={`Swap colors [${hotkeys.swap}]`}
            >
              <ArrowLeftRight size={14} />
            </button>
          </div>

          {/* 4 Brush Sizes */}
          <div className="skribbl-brush-sizes-row">
            {SKRIBBL_BRUSH_SIZES.map((sz, idx) => (
              <button
                key={sz}
                type="button"
                className={`skribbl-brush-size-btn ${currentSize === sz ? 'active' : ''}`}
                onClick={() => {
                  soundManager.playPop();
                  setCurrentSize(sz);
                }}
                title={`Brush size ${sz}px [${idx + 1}]`}
              >
                <span
                  className="size-dot-inner"
                  style={{ width: Math.min(24, sz * 0.7 + 4), height: Math.min(24, sz * 0.7 + 4) }}
                />
              </button>
            ))}
          </div>

          {/* 2-Row Authentic Skribbl Color Grid */}
          <div className="skribbl-palette-grid-2rows">
            {SKRIBBL_PALETTE.map((c, i) => (
              <button
                key={i}
                type="button"
                className={`skribbl-color-swatch ${currentColor === c && tool !== 'eraser' ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => handleColorSelect(c)}
              />
            ))}
          </div>

          {/* Action Tools: Pen, Fill, Eraser, Clear, Undo */}
          <div className="skribbl-actions-group">
            <button
              type="button"
              className={`skribbl-tool-icon-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => {
                soundManager.playPop();
                setTool('pen');
              }}
              title={`Pen [${hotkeys.brush}]`}
            >
              <Paintbrush size={18} />
            </button>

            <button
              type="button"
              className={`skribbl-tool-icon-btn ${tool === 'fill' ? 'active' : ''}`}
              onClick={() => {
                soundManager.playPop();
                setTool('fill');
              }}
              title={`Bucket Fill [${hotkeys.fill}]`}
            >
              <PaintBucket size={18} />
            </button>

            <button
              type="button"
              className={`skribbl-tool-icon-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => {
                soundManager.playPop();
                setTool('eraser');
              }}
              title="Eraser [E]"
            >
              <Eraser size={18} />
            </button>

            <button
              type="button"
              className="skribbl-tool-icon-btn"
              onClick={handleUndo}
              title={`Undo [${hotkeys.undo} / Ctrl+Z]`}
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              className="skribbl-tool-icon-btn clear-danger"
              onClick={handleClear}
              title={`Clear Canvas [${hotkeys.clear}]`}
            >
              <Trash2 size={18} />
            </button>

            <button
              type="button"
              className="skribbl-tool-icon-btn"
              onClick={handleDownload}
              title="Save Image"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
