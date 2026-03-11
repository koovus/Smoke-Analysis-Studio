import React, { useState } from 'react';
import { Settings, SlidersHorizontal, Bug } from 'lucide-react';
import { AnalyzerConfig } from '@/lib/smoke-analyzer';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ControlsPanelProps {
  onUpdate: (config: Partial<AnalyzerConfig>) => void;
}

export const ControlsPanel = ({ onUpdate }: ControlsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [threshold, setThreshold] = useState(20);
  const [brightness, setBrightness] = useState(80);
  const [debug, setDebug] = useState(false);

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setThreshold(val);
    onUpdate({ diffThreshold: val });
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setBrightness(val);
    onUpdate({ minBrightness: val });
  };

  const handleDebugChange = (checked: boolean) => {
    setDebug(checked);
    onUpdate({ showDebug: checked });
  };

  return (
    <div className="glass-panel rounded-2xl p-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-muted-foreground hover:text-primary transition-colors focus:outline-none font-mono text-sm tracking-wider"
      >
        <div className="flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          SENSITIVITY CONTROLS
        </div>
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <label className="text-muted-foreground">MOTION THRESHOLD</label>
              <span className="text-primary">{threshold}</span>
            </div>
            <input 
              type="range" 
              min="5" max="80" 
              value={threshold} 
              onChange={handleThresholdChange}
              className="w-full accent-primary h-1.5 bg-input rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <label className="text-muted-foreground">MIN BRIGHTNESS</label>
              <span className="text-primary">{brightness}</span>
            </div>
            <input 
              type="range" 
              min="20" max="150" 
              value={brightness} 
              onChange={handleBrightnessChange}
              className="w-full accent-primary h-1.5 bg-input rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Label htmlFor="debug-mode" className="flex items-center text-xs font-mono text-muted-foreground cursor-pointer">
              <Bug className="w-3 h-3 mr-2" />
              VISION DEBUG MAP
            </Label>
            <Switch 
              id="debug-mode" 
              checked={debug}
              onCheckedChange={handleDebugChange}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
        </div>
      )}
    </div>
  );
};
