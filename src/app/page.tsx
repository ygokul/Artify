'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Type, Square, Circle, MousePointer2 as MouseIcon, MoveRight, PaintBucket, Brush, Eraser, Minus, Undo, Redo, Trash2, Save, Pipette, Plus, Upload, ImageIcon, Pen, PenTool, SprayCan, Highlighter, Pencil, Droplet, Feather } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GalleryDialog } from '@/components/gallery-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useArtworks, Artwork } from '@/context/artworks-context';
import { useCollaboration } from '@/context/collaboration-context';
import { DrawingCanvas, DrawingCanvasRef, BrushType } from '@/components/drawing-canvas';
import { CollaborationToolbar } from '@/components/collaboration-toolbar';

const brushTypes: { id: BrushType, label: string, icon: any }[] = [
    { id: 'brush', label: 'Standard Brush', icon: Brush },
    { id: 'calligraphy_brush', label: 'Calligraphy Brush', icon: Pen },
    { id: 'calligraphy_pen', label: 'Calligraphy Pen', icon: PenTool },
    { id: 'airbrush', label: 'Airbrush', icon: SprayCan },
    { id: 'oil_brush', label: 'Oil Brush', icon: PaintBucket },
    { id: 'crayon', label: 'Crayon', icon: Pencil },
    { id: 'marker', label: 'Marker', icon: Highlighter },
    { id: 'pencil', label: 'Natural Pencil', icon: Pencil },
    { id: 'watercolour', label: 'Watercolour Brush', icon: Droplet },
];

const toolbarTools = [
    { id: 'brush', icon: Brush, label: 'Brush' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'arrow', icon: MoveRight, label: 'Arrow' },
    { id: 'fill', icon: PaintBucket, label: 'Fill' },
    { id: 'text', icon: Type, label: 'Text' },
];

const colors = [
  '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#808080', '#ff4500', '#9acd32', '#1e90ff', '#ffd700', '#da70d6', '#00ced1',
];

const fontFamilies = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS'];

const Toolbar = ({ tool, setTool, color, setColor, lineWidth, setLineWidth, opacity, setOpacity, brushType, setBrushType, fontSettings, setFontSettings, handleUndo, handleRedo, handleClear, handleSave, handleFileChange, handleArtSelect, isMobile }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const triggerFileSelect = () => fileInputRef.current?.click();

    const importOptions = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Import">
                    <Upload />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={triggerFileSelect}>
                    <Upload className="mr-2 h-4 w-4" />
                    From Device
                </DropdownMenuItem>
                <GalleryDialog onSelect={handleArtSelect}>
                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        From Gallery
                    </div>
                </GalleryDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const toolsGrid = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-2">
            {toolbarTools.map((t) => (
                <Button 
                    key={t.id}
                    variant={tool === t.id ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => setTool(t.id)} 
                    aria-label={t.label} 
                    title={t.label}
                >
                    <t.icon className="h-4 w-4" />
                </Button>
            ))}
        </div>
    );

    return isMobile ? (
        <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-lg mx-auto p-2 shadow-lg z-20">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div className="flex justify-around items-center">
                {/* Simplified Mobile View */}
                 <Button variant={tool === 'brush' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('brush')}><Brush /></Button>
                 <Button variant={tool === 'eraser' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('eraser')}><Eraser /></Button>
                 
                 <Sheet>
                    <SheetTrigger asChild><Button variant="ghost" size="icon"><Plus /></Button></SheetTrigger>
                     <SheetContent side="bottom" className="w-full">
                         {toolsGrid}
                         <Separator className="my-2"/>
                         <div className="space-y-4 p-2">
                             {tool === 'brush' && (
                                <div className="space-y-2">
                                    <Label>Brush Style</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {brushTypes.map(b => (
                                            <Button 
                                                key={b.id} 
                                                variant={brushType === b.id ? 'secondary' : 'outline'} 
                                                size="icon" 
                                                onClick={() => setBrushType(b.id)}
                                                title={b.label}
                                            >
                                                <b.icon className="h-4 w-4" />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                             )}
                             <div>
                                 <Label>Brush Size: {lineWidth}</Label>
                                 <Slider value={[lineWidth]} onValueChange={(v) => setLineWidth(v[0])} max={50} min={1} step={1} />
                             </div>
                             <div>
                                 <Label>Opacity: {Math.round(opacity * 100)}%</Label>
                                 <Slider value={[opacity]} onValueChange={(v) => setOpacity(v[0])} max={1} min={0.1} step={0.1} />
                             </div>
                         </div>
                    </SheetContent>
                 </Sheet>

                {/* Color Picker Sheet */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" style={{ backgroundColor: tool === 'brush' ? color : 'transparent', color: tool === 'brush' ? getContrastingTextColor(color) : 'inherit' }}><Pipette /></Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="w-full">
                        <div className="space-y-4 p-4">
                            <div className="flex items-center gap-4">
                                <Label>Select Color:</Label>
                                <input 
                                    type="color" 
                                    value={color} 
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-12 h-12 p-0 border rounded cursor-pointer"
                                />
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {colors.map((c) => (<button key={c} style={{ backgroundColor: c }} className="w-10 h-10 rounded-full border-2" onClick={() => setColor(c)} />))}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                
                {importOptions}
                <Button variant="ghost" size="icon" onClick={handleSave}><Save /></Button>
            </div>
        </Card>
    ) : (
        <Card className="w-16 flex flex-col items-center p-2 space-y-2 shadow-lg overflow-y-auto max-h-full">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon"><MouseIcon /></Button>
                </PopoverTrigger>
                <PopoverContent side="right" className="w-64">
                    {toolsGrid}
                </PopoverContent>
            </Popover>

            <Separator />
            
            <Button variant={tool === 'brush' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('brush')} title="Brush"><Brush /></Button>
            <Button variant={tool === 'eraser' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('eraser')} title="Eraser"><Eraser /></Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" style={{ backgroundColor: color }} title="Color"><Pipette className={getContrastingTextColor(color) === 'white' ? 'text-white' : 'text-black'}/></Button>
                </PopoverTrigger>
                <PopoverContent side="right" className="w-80">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <Label>Custom Color:</Label>
                             <input 
                                type="color" 
                                value={color} 
                                onChange={(e) => setColor(e.target.value)}
                                className="w-10 h-10 p-0 border rounded cursor-pointer"
                             />
                        </div>
                        <div className="grid grid-cols-8 gap-2">
                             {colors.map((c) => (<button key={c} style={{ backgroundColor: c }} className="w-8 h-8 rounded-full border-2" onClick={() => setColor(c)} />))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="icon"><Plus /></Button></PopoverTrigger>
                <PopoverContent side="right" className="w-64 space-y-4 p-4">
                    {tool === 'brush' && (
                        <div className="space-y-2">
                            <Label>Brush Style</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {brushTypes.map(b => (
                                    <Button 
                                        key={b.id} 
                                        variant={brushType === b.id ? 'secondary' : 'outline'} 
                                        size="icon" 
                                        onClick={() => setBrushType(b.id)}
                                        title={b.label}
                                    >
                                        <b.icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Size ({lineWidth}px)</Label>
                        <Slider value={[lineWidth]} onValueChange={(v) => setLineWidth(v[0])} max={50} min={1} step={1} />
                    </div>
                    <div className="space-y-2">
                        <Label>Opacity ({Math.round(opacity * 100)}%)</Label>
                        <Slider value={[opacity]} onValueChange={(v) => setOpacity(v[0])} max={1} min={0.1} step={0.1} />
                    </div>
                </PopoverContent>
            </Popover>
            
            {tool === 'text' && (
                 <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon"><Type /></Button></PopoverTrigger>
                    <PopoverContent side="right" className="w-64 space-y-4 p-4">
                        <div className="space-y-2">
                            <Label>Font Family</Label>
                            <select 
                                className="w-full p-2 border rounded"
                                value={fontSettings.family}
                                onChange={(e) => setFontSettings({...fontSettings, family: e.target.value})}
                            >
                                {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Font Size ({fontSettings.size}px)</Label>
                            <Slider value={[fontSettings.size]} onValueChange={(v) => setFontSettings({...fontSettings, size: v[0]})} max={100} min={10} step={2} />
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            <Separator />
            {importOptions}
            <Separator />

            <Button variant="ghost" size="icon" onClick={handleUndo} title="Undo"><Undo /></Button>
            <Button variant="ghost" size="icon" onClick={handleRedo} title="Redo"><Redo /></Button>
            <Button variant="ghost" size="icon" onClick={handleClear} title="Clear"><Trash2 /></Button>
            <Button variant="ghost" size="icon" onClick={handleSave} title="Save"><Save /></Button>
        </Card>
    );
};

function CanvasPage() {
  const [tool, setTool] = useState<any>('brush'); // any to support string extension
  const [brushType, setBrushType] = useState<BrushType>('brush');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [opacity, setOpacity] = useState(1);
  const [fontSettings, setFontSettings] = useState({ family: 'Arial', size: 24, bold: false, italic: false });
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const { addArtwork, setArtToEdit } = useArtworks();
  const { 
    currentCanvas, 
    isCollaborating, 
    broadcastCanvasAction, 
    setCurrentTool,
    currentCanvasActions
  } = useCollaboration();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Handle drawing actions from the canvas
  const handleDrawingAction = useCallback((action: {
    type: 'start' | 'draw_stroke' | 'finish' | 'clear' | 'undo' | 'redo' | 'draw_shape' | 'fill' | 'draw_text';
    data?: any;
  }) => {
    if (isCollaborating && currentCanvas && currentUser) {
      broadcastCanvasAction({
        type: action.type,
        data: action.data || {},
      });
    }
  }, [isCollaborating, currentCanvas, currentUser, broadcastCanvasAction]);

  const handleSave = useCallback(async () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      if (canvasRef.current.isEmpty()) {
        toast({
          title: "Canvas is empty",
          description: "Draw something before saving!",
          variant: 'destructive',
        });
        return;
      }

      // If collaborating, save to collaborative canvas, otherwise save as regular artwork
      if (isCollaborating && currentCanvas) {
        // Always save to personal gallery as requested by user
        await addArtwork(dataUrl, undefined, 'canvas');

        toast({
          title: "Canvas saved",
          description: `Saved to gallery and collaborative canvas: ${currentCanvas.name}`,
        });
      } else {
        await addArtwork(dataUrl, undefined, 'canvas');
      }
    }
  }, [addArtwork, toast, isCollaborating, currentCanvas]);
  
  const handleClear = useCallback(() => {
    canvasRef.current?.clear();
    // Note: broadcastCanvasAction is now handled inside the canvas component
  }, []);

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo();
    // Note: broadcastCanvasAction is now handled inside the canvas component
  }, []);

  const handleRedo = useCallback(() => {
    canvasRef.current?.redo();
    // Note: broadcastCanvasAction is now handled inside the canvas component
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          canvasRef.current?.loadImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow selecting the same file again
    e.target.value = '';
  };

  const handleArtSelect = (artwork: Artwork) => {
    canvasRef.current?.loadImage(artwork.imageUrl);
  };

  const handleStartCollaborativeSession = (canvasName: string) => {
    toast({
      title: "Collaborative session started",
      description: `${canvasName} is ready for collaboration!`,
    });
  };

  // Update current tool in collaboration context when tool changes
  useEffect(() => {
    if (isCollaborating) {
      setCurrentTool(tool);
    }
  }, [tool, isCollaborating, setCurrentTool]);
  
  const toolbarProps = { 
    tool, 
    setTool, 
    color, 
    setColor, 
    lineWidth, 
    setLineWidth, 
    opacity, 
    setOpacity, 
    brushType,
    setBrushType,
    fontSettings, 
    setFontSettings,
    handleUndo, 
    handleRedo, 
    handleClear, 
    handleSave, 
    handleFileChange, 
    handleArtSelect, 
    isMobile 
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'z':
            e.preventDefault();
            handleUndo();
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  return (
    <div className="flex flex-col w-full h-[calc(100svh-3.5rem)] md:h-[calc(100svh-theme(spacing.4))] overflow-hidden">
      {/* Collaboration Toolbar */}
      <CollaborationToolbar onStartCollaborativeSession={handleStartCollaborativeSession} />
      
      {/* Main Canvas Area */}
      <div className="flex flex-1 gap-4 p-2 md:p-4 min-h-0">
        <Toolbar {...toolbarProps} />
        <main className="flex-1 w-full h-full min-h-0">
          <Card className="flex-1 w-full h-full overflow-hidden shadow-lg">
            <CardContent className="p-0 h-full">
              <DrawingCanvas
                ref={canvasRef}
                tool={tool}
                color={color}
                lineWidth={lineWidth}
                opacity={opacity}
                brushType={brushType}
                fontSettings={fontSettings}
                onDrawingAction={handleDrawingAction}
                incomingActions={currentCanvasActions}
                currentUserId={currentUser?.id}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function getContrastingTextColor(hexcolor: string){
  if (hexcolor.startsWith('#')) {
    hexcolor = hexcolor.slice(1);
  }
  const r = parseInt(hexcolor.substring(0,2),16);
  const g = parseInt(hexcolor.substring(2,4),16);
  const b = parseInt(hexcolor.substring(4,6),16);
  const yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? 'black' : 'white';
}

export default function HomePage() {
  return (
      <CanvasPage />
  )
}
