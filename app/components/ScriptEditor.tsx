import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FileText, Save, RotateCcw, Copy, Clipboard } from 'lucide-react';

interface ScriptEditorProps {
  script: string;
  onScriptChange: (script: string) => void;
  onSave?: () => void;
  disabled?: boolean;
  className?: string;
}

const SAMPLE_SCRIPT = `Welcome to the LiveKit Teleprompter demonstration. This innovative tool uses advanced speech recognition to automatically scroll your script as you speak.

The teleprompter listens to your voice in real-time and matches what you're saying with the pre-written text. As you read, the display automatically advances to keep your current position centered on the screen.

This technology is perfect for presentations, video recordings, live streams, and any situation where you need to deliver prepared content naturally.

You can skip sections, improvise, or even go back - the teleprompter will intelligently track your position and adjust accordingly.

Try reading this sample script aloud to see how the teleprompter follows your pace. The system adapts to your natural speaking rhythm, ensuring you never lose your place.

Thank you for trying the LiveKit Teleprompter. We hope this tool helps you deliver your message with confidence and ease.`;

export function ScriptEditor({
  script,
  onScriptChange,
  onSave,
  disabled = false,
  className
}: ScriptEditorProps) {
  const [localScript, setLocalScript] = useState(script);
  const [wordCount, setWordCount] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalScript(script);
    setHasChanges(false);
  }, [script]);

  useEffect(() => {
    const words = localScript.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [localScript]);

  const handleScriptChange = (value: string) => {
    setLocalScript(value);
    setHasChanges(value !== script);
    onScriptChange(value);
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
      setHasChanges(false);
    }
  };

  const handleLoadSample = () => {
    handleScriptChange(SAMPLE_SCRIPT);
  };

  const handleClear = () => {
    handleScriptChange('');
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(localScript);
    } catch (err) {
      console.error('Failed to copy script:', err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleScriptChange(text);
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };

  const estimatedReadingTime = Math.ceil(wordCount / 150); // Assuming 150 words per minute

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Script Editor</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {wordCount} words
            </Badge>
            <Badge variant="outline" className="text-xs">
              ~{estimatedReadingTime} min
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="script-input">Teleprompter Script</Label>
          <Textarea
            id="script-input"
            value={localScript}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleScriptChange(e.target.value)}
            placeholder="Type or paste your script here..."
            disabled={disabled}
            className="min-h-[300px] font-mono text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Enter the text you want to read. The teleprompter will automatically scroll as you speak.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
            disabled={disabled}
          >
            <FileText className="h-4 w-4 mr-2" />
            Load Sample
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyToClipboard}
            disabled={disabled || !localScript}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePasteFromClipboard}
            disabled={disabled}
          >
            <Clipboard className="h-4 w-4 mr-2" />
            Paste
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled || !localScript}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>

          {onSave && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={disabled || !hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}