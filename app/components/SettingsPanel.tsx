import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Settings, 
  Type, 
  Gauge, 
  Eye, 
  EyeOff,
  Palette,
  RotateCcw,
  Download,
  Moon,
  Sun
} from 'lucide-react';

interface TeleprompterSettings {
  fontSize: number;
  scrollSpeed: number;
  showInterim: boolean;
  darkMode: boolean;
  fontFamily: 'sans' | 'serif' | 'mono';
  lineHeight: number;
  wordSpacing: number;
  backgroundColor: string;
  textColor: string;
  highlightFinal: boolean;
}

interface SettingsPanelProps {
  settings: TeleprompterSettings;
  onSettingsChange: (settings: TeleprompterSettings) => void;
  className?: string;
}

const DEFAULT_SETTINGS: TeleprompterSettings = {
  fontSize: 24,
  scrollSpeed: 50,
  showInterim: true,
  darkMode: false,
  fontFamily: 'sans',
  lineHeight: 1.5,
  wordSpacing: 0.1,
  backgroundColor: '#ffffff',
  textColor: '#000000',
  highlightFinal: true,
};

export function SettingsPanel({ 
  settings, 
  onSettingsChange, 
  className 
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  const updateSetting = <K extends keyof TeleprompterSettings>(
    key: K, 
    value: TeleprompterSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const resetToDefaults = () => {
    onSettingsChange(DEFAULT_SETTINGS);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teleprompter-settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fontFamilyOptions = [
    { value: 'sans', label: 'Sans Serif', class: 'font-sans' },
    { value: 'serif', label: 'Serif', class: 'font-serif' },
    { value: 'mono', label: 'Monospace', class: 'font-mono' },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className={className}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Teleprompter Settings</SheetTitle>
          <SheetDescription>
            Customize the appearance and behavior of your teleprompter
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Typography Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4" />
                Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Font Size</Label>
                  <Badge variant="secondary">{settings.fontSize}px</Badge>
                </div>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => updateSetting('fontSize', value || 24)}
                  min={12}
                  max={72}
                  step={2}
                  className="w-full"
                />
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <Label>Font Family</Label>
                <div className="grid grid-cols-3 gap-2">
                  {fontFamilyOptions.map(({ value, label, class: className }) => (
                    <Button
                      key={value}
                      variant={settings.fontFamily === value ? "default" : "outline"}
                      onClick={() => updateSetting('fontFamily', value)}
                      className={`text-xs ${className}`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Line Height */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Line Height</Label>
                  <Badge variant="secondary">{settings.lineHeight}</Badge>
                </div>
                <Slider
                  value={[settings.lineHeight]}
                  onValueChange={([value]) => updateSetting('lineHeight', value || 1.5)}
                  min={1.0}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Word Spacing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Word Spacing</Label>
                  <Badge variant="secondary">{settings.wordSpacing}em</Badge>
                </div>
                <Slider
                  value={[settings.wordSpacing]}
                  onValueChange={([value]) => updateSetting('wordSpacing', value || 0.1)}
                  min={0}
                  max={0.5}
                  step={0.05}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Scrolling & Behavior */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Scrolling & Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scroll Speed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Auto-scroll Speed</Label>
                  <Badge variant="secondary">{settings.scrollSpeed}%</Badge>
                </div>
                <Slider
                  value={[settings.scrollSpeed]}
                  onValueChange={([value]) => updateSetting('scrollSpeed', value || 50)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Show Interim Results */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Interim Transcripts</Label>
                  <p className="text-xs text-muted-foreground">
                    Display partial results as speech is being processed
                  </p>
                </div>
                <Toggle
                  pressed={settings.showInterim}
                  onPressedChange={(pressed) => updateSetting('showInterim', pressed)}
                  aria-label="Show interim transcripts"
                >
                  {settings.showInterim ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Toggle>
              </div>

              {/* Highlight Final */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Highlight Final Results</Label>
                  <p className="text-xs text-muted-foreground">
                    Emphasize finalized transcript text
                  </p>
                </div>
                <Toggle
                  pressed={settings.highlightFinal}
                  onPressedChange={(pressed) => updateSetting('highlightFinal', pressed)}
                  aria-label="Highlight final transcripts"
                >
                  <Palette className="h-4 w-4" />
                </Toggle>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Toggle
                  pressed={settings.darkMode}
                  onPressedChange={(pressed) => updateSetting('darkMode', pressed)}
                  aria-label="Toggle dark mode"
                >
                  {settings.darkMode ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Toggle>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                    className="w-12 h-8 rounded border border-input bg-background"
                  />
                  <code className="text-xs text-muted-foreground">
                    {settings.backgroundColor}
                  </code>
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => updateSetting('textColor', e.target.value)}
                    className="w-12 h-8 rounded border border-input bg-background"
                  />
                  <code className="text-xs text-muted-foreground">
                    {settings.textColor}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={resetToDefaults}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              <Button
                onClick={exportSettings}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Settings are automatically saved locally
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { DEFAULT_SETTINGS };
export type { TeleprompterSettings };