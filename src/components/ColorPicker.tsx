import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import TextField from './TextField';
import TabControl from './TabControl';

// ===== Types =====
export type HSVA = { h: number; s: number; v: number; a: number };
export type RGBA = { r: number; g: number; b: number; a: number };

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#0B1D3A', '#2563EB', '#60A5FA', '#0D9488',
  '#14B8A6', '#059669', '#84CC16', '#708D23',
  '#FACC15', '#F59E0B', '#FB923C', '#FB7185',
  '#DC2626', '#DB2777', '#C084FC', '#7C3AED',
  '#4338CA', '#475569', '#CBD5E1', '#4B164C'
];

// ===== Utilities =====
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d === 0) h = 0;
  else if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function hsvaToRgba(hsva: HSVA): RGBA {
  const { r, g, b } = hsvToRgb(hsva.h, hsva.s / 100, hsva.v / 100);
  return { r, g, b, a: hsva.a };
}

function rgbaToHsva(rgba: RGBA): HSVA {
  const { h, s, v } = rgbToHsv(rgba.r, rgba.g, rgba.b);
  return { h, s: s * 100, v: v * 100, a: rgba.a };
}

function componentToHex(c: number) {
  const hex = clamp(Math.round(c), 0, 255).toString(16).toUpperCase();
  return hex.length === 1 ? "0" + hex : hex;
}

function rgbaToHex(rgba: RGBA) {
  const { r, g, b } = rgba;
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function parseHex(hex: string): RGBA | null {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, "").trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return { r, g, b, a: 1 };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  return null;
}

function parseRgb(rgb: string): RGBA | null {
  // Match formats like "rgb(255, 0, 0)", "rgba(255, 0, 0, 1)", or "255, 0, 0"
  const rgbMatch = rgb.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?/);
  if (rgbMatch) {
    const r = clamp(parseInt(rgbMatch[1], 10), 0, 255);
    const g = clamp(parseInt(rgbMatch[2], 10), 0, 255);
    const b = clamp(parseInt(rgbMatch[3], 10), 0, 255);
    return { r, g, b, a: 1 };
  }
  return null;
}

function parseHsl(hsl: string): RGBA | null {
  // Match formats like "hsl(360, 100%, 50%)", "hsla(360, 100%, 50%, 1)", "360, 100%, 50%", or "360, 100, 50"
  // Try with % signs first
  let hslMatch = hsl.match(/(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%/);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360;
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    
    // Convert HSL to RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (h < 1/6) [r, g, b] = [c, x, 0];
    else if (h < 2/6) [r, g, b] = [x, c, 0];
    else if (h < 3/6) [r, g, b] = [0, c, x];
    else if (h < 4/6) [r, g, b] = [0, x, c];
    else if (h < 5/6) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a: 1
    };
  }
  
  // Try without % signs (treat as 0-100 range)
  hslMatch = hsl.match(/(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360;
    const s = clamp(parseFloat(hslMatch[2]), 0, 100) / 100;
    const l = clamp(parseFloat(hslMatch[3]), 0, 100) / 100;
    
    // Convert HSL to RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (h < 1/6) [r, g, b] = [c, x, 0];
    else if (h < 2/6) [r, g, b] = [x, c, 0];
    else if (h < 3/6) [r, g, b] = [0, c, x];
    else if (h < 4/6) [r, g, b] = [0, x, c];
    else if (h < 5/6) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a: 1
    };
  }
  
  return null;
}

function rgbaToRgb(rgba: RGBA): string {
  return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
}

function rgbaToHsl(rgba: RGBA): string {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d) % 6;
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  
  return `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export default function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hsva, setHsva] = useState<HSVA>({ h: 260, s: 65, v: 60, a: 1 });
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');

  // Refs for interaction
  const svRef = useRef<HTMLDivElement>(null);
  const hueTrackRef = useRef<HTMLDivElement>(null);

  // Computed values
  const rgba = useMemo(() => hsvaToRgba(hsva), [hsva]);
  const hex = useMemo(() => rgbaToHex(rgba), [rgba]);
  const rgb = useMemo(() => rgbaToRgb(rgba), [rgba]);
  const hsl = useMemo(() => rgbaToHsl(rgba), [rgba]);

  // Get formatted color value based on selected format
  const formattedColor = useMemo(() => {
    switch (colorFormat) {
      case 'rgb': return rgb;
      case 'hsl': return hsl;
      default: return hex;
    }
  }, [colorFormat, hex, rgb, hsl]);

  // Initialize from selectedColor
  useEffect(() => {
    if (selectedColor) {
      let parsed: RGBA | null = null;
      
      // Try parsing as hex first
      parsed = parseHex(selectedColor);
      
      // If not hex, try RGB
      if (!parsed) {
        parsed = parseRgb(selectedColor);
      }
      
      // If not RGB, try HSL
      if (!parsed) {
        parsed = parseHsl(selectedColor);
      }
      
      if (parsed) {
        setHsva(rgbaToHsva(parsed));
      }
    }
  }, [selectedColor]);

  // ===== SV (Saturation-Value) square =====
  const handleSVPointer = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!svRef.current) return;
    const rect = svRef.current.getBoundingClientRect();
    const x = clamp((("clientX" in e ? e.clientX : 0) - rect.left) / rect.width);
    const y = clamp((("clientY" in e ? e.clientY : 0) - rect.top) / rect.height);
    const s = Math.round(x * 100);
    const v = Math.round((1 - y) * 100);
    setHsva(prev => ({ ...prev, s, v }));
  }, []);

  const onSVMouseDown = (e: React.MouseEvent) => {
    handleSVPointer(e);
    const move = (ev: MouseEvent) => handleSVPointer(ev);
    const up = () => { 
      window.removeEventListener("mousemove", move); 
      window.removeEventListener("mouseup", up); 
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // ===== Hue slider =====
  const onHueDown = (e: React.MouseEvent) => {
    const handle = (ev: MouseEvent | React.MouseEvent) => {
      if (!hueTrackRef.current) return;
      const rect = hueTrackRef.current.getBoundingClientRect();
      const x = clamp((("clientX" in ev ? ev.clientX : 0) - rect.left) / rect.width);
      setHsva(prev => ({ ...prev, h: Math.round(x * 360) }));
    };
    handle(e);
    const move = (ev: MouseEvent) => handle(ev);
    const up = () => { 
      window.removeEventListener("mousemove", move); 
      window.removeEventListener("mouseup", up); 
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };


  // ===== Input handlers =====
  const onColorInputChange = (value: string) => {
    let parsed: RGBA | null = null;
    
    switch (colorFormat) {
      case 'hex':
        parsed = parseHex(value);
        break;
      case 'rgb':
        parsed = parseRgb(value);
        break;
      case 'hsl':
        parsed = parseHsl(value);
        break;
    }
    
    if (parsed) {
      setHsva(rgbaToHsva(parsed));
    }
  };


  const applyCustomColor = () => {
    // Always apply as hex format for consistency
    onColorChange(hex);
    setShowAdvanced(false);
  };

  // ===== Computed styles =====
  const currentHueColor = useMemo(() => {
    const { r, g, b } = hsvToRgb(hsva.h, 1, 1);
    return `rgb(${r}, ${g}, ${b})`;
  }, [hsva.h]);


  const formatOptions = [
    { value: 'hex', label: 'HEX' },
    { value: 'rgb', label: 'RGB' },
    { value: 'hsl', label: 'HSL' }
  ];

  // Check if selected color is a custom color (not in preset colors)
  const isCustomColor = selectedColor && !PRESET_COLORS.includes(selectedColor);

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-8 h-8 rounded-lg transition-all hover:scale-105 ${
              selectedColor === color ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: color,
              '--tw-ring-color': color
            } as React.CSSProperties}
          />
        ))}
        {/* Show custom color if it's not a preset */}
        {isCustomColor && (
          <button
            onClick={() => onColorChange(selectedColor)}
            className={`w-8 h-8 rounded-lg transition-all hover:scale-105 ring-2 ring-offset-2`}
            style={{
              backgroundColor: selectedColor,
              '--tw-ring-color': selectedColor
            } as React.CSSProperties}
            title={`Custom color: ${selectedColor}`}
          />
        )}
        <div className="relative group">
          <button
            onClick={() => setShowAdvanced(true)}
            className="w-8 h-8 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
          >
            <Plus className="text-gray-400 w-3/4 h-3/4" />
          </button>
          <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            Apply custom color
          </div>
        </div>
      </div>

      {showAdvanced && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Custom Color</h3>
              <button
                onClick={() => setShowAdvanced(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Format Switch */}
            <div className="mb-4">
              <TabControl
                options={formatOptions}
                value={colorFormat}
                onChange={(value) => setColorFormat(value as 'hex' | 'rgb' | 'hsl')}
                primaryColor="#2563EB"
                className="w-full"
              />
            </div>

            {/* SV Square */}
            <div
              ref={svRef}
              onMouseDown={onSVMouseDown}
              className="relative rounded-lg overflow-hidden shadow-xl mb-3"
              style={{ width: "100%", height: 0, paddingBottom: "60%" }}
            >
              {/* Base: hue-colored */}
              <div
                className="absolute inset-0"
                style={{ background: currentHueColor }}
              />
              {/* White gradient (left to right) */}
              <div className="absolute inset-0" style={{
                background: "linear-gradient(90deg, #ffffff, rgba(255,255,255,0))",
              }} />
              {/* Black gradient (top to bottom) */}
              <div className="absolute inset-0" style={{
                background: "linear-gradient(0deg, #000000, rgba(0,0,0,0))",
              }} />

              {/* Thumb */}
              <div
                className="absolute h-6 w-6 rounded-full border-2 border-white shadow-md"
                style={{ 
                  transform: "translate(-50%, -50%)", 
                  left: `${hsva.s}%`,
                  top: `${100 - hsva.v}%`
                }}
              >
                <div className="h-full w-full rounded-full border border-black/30" />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2 mb-4">
              {/* Hue */}
              <div className="px-2">
                <div ref={hueTrackRef} onMouseDown={onHueDown}>
                  <div className="relative h-4 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(90deg, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)"
                      }}
                    />
                    <div
                      className="absolute -top-1 h-6 w-6 rounded-full ring-2 ring-white shadow-md"
                      style={{ left: `calc(${(hsva.h / 360) * 100}% - 12px)` }}
                    >
                      <div className="h-full w-full rounded-full border border-black/30" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Color Input */}
            <div className="mb-4">
              <TextField
                value={formattedColor}
                primaryColor="#2563EB"
                showLabel={false}
                onChange={onColorInputChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <SecondaryButton
                onClick={() => setShowAdvanced(false)}
                className="flex-1"
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton
                onClick={applyCustomColor}
                className="flex-1"
              >
                Apply Color
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}