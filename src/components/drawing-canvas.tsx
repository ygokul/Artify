
'use client';

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useArtworks } from '@/context/artworks-context';

export type CanvasTool = 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'fill' | 'text';
export type BrushType = 'brush' | 'calligraphy_brush' | 'calligraphy_pen' | 'airbrush' | 'oil_brush' | 'crayon' | 'marker' | 'pencil' | 'watercolour';

type DrawingCanvasProps = {
    tool: CanvasTool;
    color: string;
    lineWidth: number;
    opacity: number;
    brushType?: BrushType;
    fillColor?: string; // For bucket tool or shape fill if implemented later (currently using color)
    fontSettings?: {
        family: string;
        size: number;
        bold: boolean;
        italic: boolean;
    };
    onDrawingAction?: (action: {
        type: 'start' | 'draw_stroke' | 'draw_shape' | 'fill' | 'draw_text' | 'finish' | 'clear' | 'undo' | 'redo';
        data?: any;
    }) => void;
    incomingActions?: Array<{
        id: string;
        type: string;
        data: any;
        userId: string;
        userName: string;
        timestamp: string;
    }>;
    currentUserId?: string;
};

export type DrawingCanvasRef = {
    toDataURL: () => string;
    clear: () => void;
    undo: () => void;
    redo: () => void;
    isEmpty: () => boolean;
    loadImage: (dataUrl: string) => void;
};

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
    ({ tool, color, lineWidth, opacity, brushType = 'brush', fontSettings, onDrawingAction, incomingActions, currentUserId }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const contextRef = useRef<CanvasRenderingContext2D | null>(null);
        const isDrawingRef = useRef(false);
        const startCoordsRef = useRef<{ x: number, y: number } | null>(null);
        const historyRef = useRef<ImageData[]>([]);
        const historyIndexRef = useRef(-1);
        const { artToEdit, clearArtToEdit } = useArtworks();
        const lastProcessedActionRef = useRef<string>('');

        // Text input state
        const [textInputVisible, setTextInputVisible] = useState(false);
        const [textInputCoords, setTextInputCoords] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
        const [textValue, setTextValue] = useState('');
        const textInputRef = useRef<HTMLInputElement>(null);

        // Store current drawing path for collaboration (brush/eraser)
        const currentPathRef = useRef<Array<{ x: number, y: number }>>([]);

        const setCanvasSize = useCallback(() => {
            const canvas = canvasRef.current;
            const context = contextRef.current;
            if (canvas && context) {
                const { width, height } = canvas.getBoundingClientRect();
                if (canvas.width !== width || canvas.height !== height) {
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    // Preserve content
                    if (canvas.width > 0 && canvas.height > 0 && tempCtx) tempCtx.drawImage(canvas, 0, 0);

                    canvas.width = width;
                    canvas.height = height;

                    if (tempCtx && tempCanvas.width > 0 && tempCanvas.height > 0) {
                        context.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, width, height);
                    } else {
                        context.fillStyle = "white";
                        context.fillRect(0, 0, canvas.width, canvas.height);
                    }
                }
            }
        }, []);

        const saveState = useCallback(() => {
            if (canvasRef.current && contextRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
                const canvas = canvasRef.current;
                const imageData = contextRef.current.getImageData(0, 0, canvas.width, canvas.height);

                const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
                newHistory.push(imageData);

                const finalHistory = newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;

                historyRef.current = finalHistory;
                historyIndexRef.current = finalHistory.length - 1;
            }
        }, []);

        const loadImageToCanvas = useCallback((dataUrl: string) => {
            const canvas = canvasRef.current;
            const context = contextRef.current;
            if (canvas && context) {
                const image = new Image();
                image.crossOrigin = "anonymous";
                image.src = dataUrl;
                image.onload = () => {
                    context.fillStyle = "white";
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    const canvasAspect = canvas.width / canvas.height;
                    const imageAspect = image.width / image.height;
                    let drawWidth = canvas.width;
                    let drawHeight = canvas.height;
                    let x = 0;
                    let y = 0;

                    if (imageAspect > canvasAspect) {
                        drawHeight = canvas.width / imageAspect;
                        y = (canvas.height - drawHeight) / 2;
                    } else {
                        drawWidth = canvas.height * imageAspect;
                        x = (canvas.width - drawWidth) / 2;
                    }

                    context.drawImage(image, x, y, drawWidth, drawHeight);
                    saveState();
                };
            }
        }, [saveState]);

        // --- Helper Drawing Functions ---

        const drawShape = (
            ctx: CanvasRenderingContext2D, 
            type: 'line' | 'rectangle' | 'circle' | 'arrow', 
            start: { x: number, y: number }, 
            end: { x: number, y: number },
            color: string,
            lineWidth: number,
            opacity: number
        ) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.globalAlpha = opacity;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (type === 'line') {
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
            } else if (type === 'rectangle') {
                ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
            } else if (type === 'circle') {
                const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
            } else if (type === 'arrow') {
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                const headLength = lineWidth * 3; 
                ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
            }
            ctx.stroke();
            ctx.globalAlpha = 1.0; // Reset opacity
        };

        const floodFill = (ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string, opacity: number) => {
            const canvas = ctx.canvas;
            const w = canvas.width;
            const h = canvas.height;
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data; // RGBA array

            // Parse hex color to RGB
            let r: number, g: number, b: number;
            if (fillColor.startsWith('#')) {
                const hex = fillColor.slice(1);
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            } else {
                return; 
            }
            // Use 255 for alpha in internal buffer, handle globalAlpha logic if needed or pre-blend
            // Simple flood fill usually replaces exact match. Implementing tolerance is better but sticking to simple for now.
            // Note: Canvas doesn't support 'globalAlpha' for pixel manipulation directly. We just write the color.
            // To support opacity, we would need to blend. For simplicity, we'll write solid color or blend manually.
            const a = Math.round(opacity * 255);

            const startPos = (y * w + x) * 4;
            const startR = data[startPos];
            const startG = data[startPos + 1];
            const startB = data[startPos + 2];
            const startA = data[startPos + 3];

            if (startR === r && startG === g && startB === b && startA === a) {
                return;
            }

            const stack = [[x, y]];

            while (stack.length) {
                const newPos = stack.pop();
                if(!newPos) continue;
                const [cx, cy] = newPos;
                const pixelPos = (cy * w + cx) * 4;

                if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
                    if (
                        data[pixelPos] === startR &&
                        data[pixelPos + 1] === startG &&
                        data[pixelPos + 2] === startB &&
                        data[pixelPos + 3] === startA
                    ) {
                        data[pixelPos] = r;
                        data[pixelPos + 1] = g;
                        data[pixelPos + 2] = b;
                        data[pixelPos + 3] = a;

                        stack.push([cx + 1, cy]);
                        stack.push([cx - 1, cy]);
                        stack.push([cx, cy + 1]);
                        stack.push([cx, cy - 1]);
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
        };

        const renderText = (
            ctx: CanvasRenderingContext2D, 
            text: string, 
            x: number, 
            y: number, 
            fontSettings: { family: string, size: number, bold: boolean, italic: boolean },
            color: string,
            opacity: number
        ) => {
            const fontString = `${fontSettings.italic ? 'italic ' : ''}${fontSettings.bold ? 'bold ' : ''}${fontSettings.size}px ${fontSettings.family}`;
            ctx.font = fontString;
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            ctx.fillText(text, x, y);
            ctx.globalAlpha = 1.0;
        };

        const renderBrushStroke = (
            ctx: CanvasRenderingContext2D,
            path: Array<{x: number, y: number}>,
            type: BrushType,
            color: string,
            width: number,
            opacity: number
        ) => {
            if (path.length < 1) return;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = color;
            ctx.fillStyle = color;

            // Reset standard properties that might have been changed
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.globalCompositeOperation = 'source-over';

            if (type === 'brush') {
                ctx.beginPath();
                ctx.lineWidth = width;
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                }
                ctx.stroke();
            }
            else if (type === 'calligraphy_brush') {
                // Calligraphy: Ellipical brush roughly
                for (let i = 1; i < path.length; i++) {
                    const p1 = path[i-1];
                    const p2 = path[i];
                    const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    
                    for (let j = 0; j < dist; j+=1) {
                         const x = p1.x + (Math.cos(angle) * j);
                         const y = p1.y + (Math.sin(angle) * j);
                         ctx.beginPath();
                         ctx.ellipse(x, y, width/2, width/6, Math.PI / 4, 0, 2 * Math.PI);
                         ctx.fill();
                    }
                }
            }
            else if (type === 'calligraphy_pen') {
                 // Calligraphy Pen: Fixed angle line
                 ctx.lineWidth = width / 4; 
                 // We imitate a flat nib at 45 degrees
                 for (let i = 1; i < path.length; i++) {
                    const p1 = path[i-1];
                    const p2 = path[i];
                     
                     // Interpolate
                    const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    
                    for (let j = 0; j <= dist; j+=0.5) {
                         const x = p1.x + (Math.cos(angle) * j);
                         const y = p1.y + (Math.sin(angle) * j);
                         
                         ctx.beginPath();
                         ctx.moveTo(x - width/2, y - width/2);
                         ctx.lineTo(x + width/2, y + width/2);
                         ctx.stroke();
                    }
                 }
            }
            else if (type === 'airbrush') {
                ctx.lineWidth = 0;
                for (let i = 0; i < path.length; i++) {
                     const {x, y} = path[i];
                     // Draw random dots around x,y
                     const density = width * 1.5; 
                     for (let j = 0; j < density; j++) {
                         const radius = Math.random() * width;
                         const a = Math.random() * Math.PI * 2;
                         const dx = Math.cos(a) * radius;
                         const dy = Math.sin(a) * radius;
                         ctx.fillRect(x + dx, y + dy, 1, 1);
                     }
                }
            }
            else if (type === 'oil_brush') {
                 // Oil: Texture, slightly varying opacity/width?
                 // Simple simulation: draw multiple lines with slight offsets
                 ctx.lineWidth = width;
                 ctx.globalAlpha = opacity * 0.8;
                
                 // Main stroke
                 ctx.beginPath();
                 ctx.moveTo(path[0].x, path[0].y);
                 for (let k = 1; k < path.length; k++) ctx.lineTo(path[k].x, path[k].y);
                 ctx.stroke();

                 // Detail strokes
                 ctx.lineWidth = 1;
                 ctx.globalAlpha = opacity * 0.4;
                 for(let offset = -width/2; offset <= width/2; offset += 2){
                     ctx.beginPath();
                     ctx.moveTo(path[0].x + offset, path[0].y + offset);
                     for (let k = 1; k < path.length; k++) ctx.lineTo(path[k].x + offset, path[k].y + offset);
                     ctx.stroke();
                 }
            }
            else if (type === 'crayon') {
                 // Crayon: No global alpha (or high), granular texture
                 // We can simulate this by drawing dots along the path with high scatter but bounded
                 ctx.fillStyle = color;
                 ctx.globalAlpha = opacity;
                 
                 for (let i = 1; i < path.length; i++) {
                     const p1 = path[i-1];
                     const p2 = path[i];
                     const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                     const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                     
                     for (let j = 0; j <= dist; j+=2) { // Step 2px
                         const x = p1.x + (Math.cos(angle) * j);
                         const y = p1.y + (Math.sin(angle) * j);
                         
                         // Draw clusters of dots to simulate wax
                         for(let d=0; d<3; d++){
                             const offX = (Math.random() - 0.5) * width;
                             const offY = (Math.random() - 0.5) * width;
                             ctx.fillRect(x + offX, y + offY, 2, 2);
                         }
                     }
                 }
            }
            else if (type === 'marker') {
                ctx.globalCompositeOperation = 'multiply'; // Markers blend
                // However, multiply on white canvas with black color is black. 
                // Multiply logic works best if we have color. 
                // Draw a thick line. Overlap will darken.
                ctx.beginPath();
                ctx.lineWidth = width;
                ctx.globalAlpha = opacity * 0.5; // Simulate transparent marker ink
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                }
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
            }
            else if (type === 'pencil') {
                ctx.lineWidth = 1; 
                ctx.strokeStyle = color;
                
                // Pencil is sketchy.
                // We just draw the path but maybe with a bit of noise or just thin?
                // Request said "Natural pencil"
                // Let's draw a few thin lines close together
                
                for(let i=0; i<width/2 + 1; i++) {
                    ctx.globalAlpha = opacity * (0.5 + Math.random()*0.5);
                    ctx.beginPath();
                    // Slight jitter
                     const jitterX = (Math.random() - 0.5) * width;
                     const jitterY = (Math.random() - 0.5) * width;
                     
                     ctx.moveTo(path[0].x + jitterX, path[0].y + jitterY);
                     for (let k = 1; k < path.length; k++) {
                         ctx.lineTo(path[k].x + jitterX, path[k].y + jitterY);
                     }
                     ctx.stroke();
                }
            }
             else if (type === 'watercolour') {
                // Watercolour: Wet edges? ShadowBlur?
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowBlur = width / 2;
                ctx.shadowColor = color;
                ctx.lineWidth = width * 0.8;
                ctx.globalAlpha = opacity * 0.3; // Very washy
                
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                }
                ctx.stroke();
                 
                // Reset shadow
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
            }
            else {
                 // Fallback to standard
                ctx.beginPath();
                ctx.lineWidth = width;
                ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                }
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1.0;
        };


        // Apply incoming drawing actions from other collaborators
        const applyIncomingAction = useCallback((action: any) => {
            if (!contextRef.current || !canvasRef.current) return;
            if (action.userId === currentUserId) return; // Don't apply our own actions

            const context = contextRef.current;
            const canvas = canvasRef.current;

            switch (action.type) {
                case 'draw_stroke':
                    if (action.data.path && action.data.path.length > 1) {
                         if (action.data.tool === 'eraser') {
                             context.beginPath();
                             context.lineWidth = action.data.lineWidth || 5;
                             context.lineCap = 'round';
                             context.lineJoin = 'round';
                             context.globalAlpha = action.data.opacity || 1.0;
                             context.globalCompositeOperation = 'destination-out';
                             context.moveTo(action.data.path[0].x, action.data.path[0].y);
                             for (let i = 1; i < action.data.path.length; i++) {
                                 context.lineTo(action.data.path[i].x, action.data.path[i].y);
                             }
                             context.stroke();
                             context.globalAlpha = 1.0;
                             context.globalCompositeOperation = 'source-over';
                         } else {
                             renderBrushStroke(
                                 context,
                                 action.data.path,
                                 action.data.brushType || 'brush', // Default to brush for backward compat
                                 action.data.color || '#000000',
                                 action.data.lineWidth || 5,
                                 action.data.opacity || 1.0
                             );
                         }
                    }
                    break;
                
                case 'draw_shape':
                    drawShape(
                        context, 
                        action.data.shapeType, 
                        action.data.start, 
                        action.data.end, 
                        action.data.color, 
                        action.data.lineWidth, 
                        action.data.opacity || 1.0
                    );
                    break;
                
                case 'fill':
                    floodFill(context, action.data.x, action.data.y, action.data.color, action.data.opacity || 1.0);
                    break;

                case 'draw_text':
                    renderText(
                        context,
                        action.data.text,
                        action.data.x,
                        action.data.y,
                        action.data.fontSettings,
                        action.data.color,
                        action.data.opacity || 1.0
                    );
                    break;

                case 'clear':
                    context.fillStyle = "white";
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    break;

                case 'undo':
                case 'redo':
                    // Not implemented in collaboration for simplicity
                    break;
            }
            // After applying remote action, update history
            saveState();
        }, [currentUserId, saveState]); // Added helper functions to deps if not defined inside (they are inside component but outside this callback... need to check scoping)
           // Actually `drawShape`, `floodFill`, `renderText` are defined in the component scope, so we can use them directly.

        // Process incoming actions
        useEffect(() => {
            if (incomingActions && incomingActions.length > 0) {
                const newActions = incomingActions.filter(action =>
                    action.id > lastProcessedActionRef.current
                );

                if (newActions.length > 0) {
                    newActions.forEach(applyIncomingAction);
                    lastProcessedActionRef.current = newActions[newActions.length - 1].id;
                }
            }
        }, [incomingActions, applyIncomingAction]);

        const getCoordinates = (e: MouseEvent | TouchEvent) => {
            if (!canvasRef.current) return null;
            const rect = canvasRef.current.getBoundingClientRect();
            let clientX, clientY;

            if (e instanceof TouchEvent) {
                if (e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    return null;
                }
            } else if (e instanceof MouseEvent) {
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                return null;
            }
            return { x: clientX - rect.left, y: clientY - rect.top };
        }

        const restoreHistory = (index: number) => {
            if (historyRef.current[index] && contextRef.current && canvasRef.current) {
                contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                contextRef.current.putImageData(historyRef.current[index], 0, 0);
            }
        }

        const handleTextSubmit = () => {
            if (textValue && contextRef.current) {
                renderText(
                    contextRef.current,
                    textValue,
                    textInputCoords.x,
                    textInputCoords.y,
                    fontSettings || { family: 'Arial', size: 20, bold: false, italic: false },
                    color,
                    opacity
                );

                onDrawingAction?.({
                    type: 'draw_text',
                    data: {
                        text: textValue,
                        x: textInputCoords.x,
                        y: textInputCoords.y,
                        fontSettings: fontSettings || { family: 'Arial', size: 20, bold: false, italic: false },
                        color,
                        opacity
                    }
                });

                saveState();
            }
            setTextInputVisible(false);
            setTextValue('');
        };

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const startDrawing = (e: MouseEvent | TouchEvent) => {
                if (tool === 'text') {
                     // Text is handled by click, but we need to prevent default behavior if needed
                     // Actually click logic is better handled separately or here.
                     // Let's use mousedown for text placement
                    const coords = getCoordinates(e);
                    if (coords) {
                        e.preventDefault();
                        setTextInputCoords(coords);
                        setTextInputVisible(true);
                        // Trigger focus on next render?
                        setTimeout(() => textInputRef.current?.focus(), 0);
                    }
                    return;
                }
                
                if (tool === 'fill') {
                     const coords = getCoordinates(e);
                     if (coords && contextRef.current) {
                         e.preventDefault();
                         floodFill(contextRef.current, Math.round(coords.x), Math.round(coords.y), color, opacity);
                         saveState();
                         onDrawingAction?.({
                             type: 'fill',
                             data: {
                                 x: Math.round(coords.x),
                                 y: Math.round(coords.y),
                                 color,
                                 opacity
                             }
                         });
                     }
                     return;
                }

                e.preventDefault();
                const coords = getCoordinates(e);
                if (coords && contextRef.current) {
                    isDrawingRef.current = true;
                    startCoordsRef.current = coords;

                    if (tool === 'brush' || tool === 'eraser') {
                        currentPathRef.current = [coords];
                        // Don't draw start point immediately for all brushes, some need path.
                        // But standard brush dot is nice.
                        // For simplicity, we just start the path. Visual feedback comes in 'draw'.
                        
                        onDrawingAction?.({
                            type: 'start',
                            data: {
                                x: coords.x,
                                y: coords.y,
                                tool,
                                color,
                                lineWidth,
                                opacity,
                                brushType: tool === 'brush' ? brushType : undefined
                            }
                        });
                    }
                }
            };

            const draw = (e: MouseEvent | TouchEvent) => {
                if (!isDrawingRef.current || !contextRef.current || !startCoordsRef.current) return;
                e.preventDefault();
                const coords = getCoordinates(e);
                
                if (coords) {
                    if (tool === 'brush' || tool === 'eraser') {
                        currentPathRef.current.push(coords);
                        
                        if (tool === 'eraser') {
                            contextRef.current.lineWidth = lineWidth;
                            contextRef.current.lineCap = 'round';
                            contextRef.current.lineJoin = 'round';
                            contextRef.current.globalAlpha = opacity;
                            contextRef.current.globalCompositeOperation = 'destination-out';
                            contextRef.current.beginPath();
                            // We need access to previous point to draw line segment
                            const prev = currentPathRef.current[currentPathRef.current.length - 2];
                            if(prev) {
                                contextRef.current.moveTo(prev.x, prev.y);
                                contextRef.current.lineTo(coords.x, coords.y);
                                contextRef.current.stroke();
                            }
                            contextRef.current.globalAlpha = 1.0;
                            contextRef.current.globalCompositeOperation = 'source-over';
                        } else {
                            // For complex brushes, we might want to only draw the *new* segment.
                            // But our renderBrushStroke function takes a path.
                            // To optimize, we should only pass the new segment to renderBrushStroke 
                            // OR renderBrushStroke needs to be smart.
                            // Most simple: pass [prev, current]
                            const prev = currentPathRef.current[currentPathRef.current.length - 2];
                            if(prev) {
                                renderBrushStroke(contextRef.current, [prev, coords], brushType, color, lineWidth, opacity);
                            }
                        }
                    } else if (['line', 'rectangle', 'circle', 'arrow'].includes(tool)) {
                        // Restore last clean state
                        restoreHistory(historyIndexRef.current);
                        // Draw preview shape
                        drawShape(contextRef.current, tool as any, startCoordsRef.current, coords, color, lineWidth, opacity);
                    }
                }
            };

            const finishDrawing = (e: MouseEvent | TouchEvent) => {
                if (!isDrawingRef.current) return;
                
                const coords = getCoordinates(e) || startCoordsRef.current; // Use last known if mouseup outside?
                // Actually if mouseup outside we might not have coords. 
                // For shapes we need final coords.
                
                // If it's a shape, we need to finalize it.
                // The 'draw' function updates the canvas with preview.
                // We just need to save state and broadcast.
                
                if (['line', 'rectangle', 'circle', 'arrow'].includes(tool) && contextRef.current && startCoordsRef.current && coords) {
                    // Final draw is already on canvas from last 'draw' call? 
                    // No, restoreHistory clears it. We must draw one last time or assume 'draw' did it?
                    // 'draw' does it on mousemove. If mouse didn't move, we have a dot or nothing.
                    // To be safe, let's redraw current shape.
                     drawShape(contextRef.current, tool as any, startCoordsRef.current, coords, color, lineWidth, opacity);
                     onDrawingAction?.({
                        type: 'draw_shape',
                        data: {
                            shapeType: tool,
                            start: startCoordsRef.current,
                            end: coords,
                            color,
                            lineWidth,
                            opacity
                        }
                    });
                } else if ((tool === 'brush' || tool === 'eraser') && contextRef.current) {
                    contextRef.current.closePath();
                    
                    if (currentPathRef.current.length > 1) {
                         onDrawingAction?.({
                            type: 'draw_stroke',
                            data: {
                                path: currentPathRef.current,
                                tool,
                                color,
                                lineWidth,
                                opacity,
                                brushType: tool === 'brush' ? brushType : undefined
                            }
                        });
                    }
                    currentPathRef.current = [];
                }

                isDrawingRef.current = false;
                startCoordsRef.current = null;
                saveState();
            };

            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', finishDrawing);
            canvas.addEventListener('mouseleave', finishDrawing);

            canvas.addEventListener('touchstart', startDrawing);
            canvas.addEventListener('touchmove', draw);
            canvas.addEventListener('touchend', finishDrawing);

            return () => {
                canvas.removeEventListener('mousedown', startDrawing);
                canvas.removeEventListener('mousemove', draw);
                canvas.removeEventListener('mouseup', finishDrawing);
                canvas.removeEventListener('mouseleave', finishDrawing);

                canvas.removeEventListener('touchstart', startDrawing);
                canvas.removeEventListener('touchmove', draw);
                canvas.removeEventListener('touchend', finishDrawing);
            };
        }, [tool, color, lineWidth, opacity, saveState, onDrawingAction, fontSettings, brushType]);

        useImperativeHandle(ref, () => ({
            toDataURL: () => {
                return canvasRef.current?.toDataURL() || '';
            },
            clear: () => {
                if (canvasRef.current && contextRef.current) {
                    const canvas = canvasRef.current;
                    contextRef.current.fillStyle = "white";
                    contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
                    saveState();
                    onDrawingAction?.({ type: 'clear', data: {} });
                }
            },
            undo: () => {
                const newIndex = historyIndexRef.current - 1;
                if (newIndex >= 0) {
                    historyIndexRef.current = newIndex;
                    restoreHistory(newIndex);
                    onDrawingAction?.({ type: 'undo', data: {} });
                }
            },
            redo: () => {
                const newIndex = historyIndexRef.current + 1;
                if (newIndex < historyRef.current.length) {
                    historyIndexRef.current = newIndex;
                    restoreHistory(newIndex);
                    onDrawingAction?.({ type: 'redo', data: {} });
                }
            },
            isEmpty: () => {
                if (!canvasRef.current || !contextRef.current) return true;
                const canvas = canvasRef.current;
                const context = contextRef.current;
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                return imageData.data.every((pixel, index) => {
                    return index % 4 === 3 ? pixel === 255 : pixel === 255;
                });
            },
            loadImage: loadImageToCanvas,
        }), [saveState, loadImageToCanvas, onDrawingAction]);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext('2d');
            if (!context) return;
            contextRef.current = context;
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
            setCanvasSize();
            saveState();

            if (artToEdit) {
                loadImageToCanvas(artToEdit);
                clearArtToEdit();
            }
            const handleResize = () => setCanvasSize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, [setCanvasSize, saveState, loadImageToCanvas, artToEdit, clearArtToEdit]);

        return (
            <div className="relative w-full h-full">
                <canvas
                    ref={canvasRef}
                    className="border border-gray-300 cursor-crosshair touch-none w-full h-full bg-white"
                />
                {textInputVisible && (
                    <input
                        ref={textInputRef}
                        type="text"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        onBlur={handleTextSubmit}
                        onKeyDown={(e) => { 
                            if(e.key === 'Enter') {
                                handleTextSubmit();
                            }
                        }}
                        style={{
                            position: 'absolute',
                            left: textInputCoords.x,
                            top: textInputCoords.y,
                            background: 'transparent',
                            border: '1px dashed #333',
                            outline: 'none',
                            fontFamily: fontSettings?.family || 'Arial',
                            fontSize: `${fontSettings?.size || 20}px`,
                            fontWeight: fontSettings?.bold ? 'bold' : 'normal',
                            fontStyle: fontSettings?.italic ? 'italic' : 'normal',
                            color: color,
                            opacity: opacity,
                        }}
                        autoFocus
                    />
                )}
            </div>
        );
    }
);
DrawingCanvas.displayName = 'DrawingCanvas';
