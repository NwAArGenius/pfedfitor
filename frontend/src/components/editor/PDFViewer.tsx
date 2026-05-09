'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage } from 'react-konva';
import { useDocumentStore } from '@/store/useDocumentStore';
import api from '@/lib/api';

// We need to set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  documentId: string;
  pageNumber: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ documentId, pageNumber }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { currentDocument, edits, addEdit } = useDocumentStore();
  const [tool, setTool] = useState<'select' | 'redact' | 'text'>('select');
  const [newRect, setNewRect] = useState<any>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadPage = async () => {
      try {
        const response = await api.get(`/documents/${documentId}/page/${pageNumber}`, {
          responseType: 'blob',
        });
        objectUrl = URL.createObjectURL(response.data);
        const img = new Image();
        img.src = objectUrl;
        img.onload = () => {
          setImage(img);
          setDimensions({ width: img.width, height: img.height });
        };
      } catch {
        console.error('Failed to load page image');
      }
    };

    if (documentId) {
      loadPage();
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, pageNumber]);

  const handleMouseDown = (e: any) => {
    if (tool === 'select') return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    setNewRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      type: tool
    });
  };

  const handleMouseMove = (e: any) => {
    if (!newRect) return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    setNewRect({
      ...newRect,
      width: pos.x - newRect.x,
      height: pos.y - newRect.y
    });
  };

  const handleMouseUp = async () => {
    if (!newRect) return;

    const editPayload = {
      page_number: pageNumber,
      edit_type: newRect.type === 'redact' ? 'redact' : 'text_replace',
      x: newRect.x,
      y: newRect.y,
      width: newRect.width,
      height: newRect.height,
      new_value: newRect.type === 'text' ? 'New Text' : undefined,
    };

    setNewRect(null);

    try {
      const { data } = await api.post(`/documents/${documentId}/edit`, editPayload);
      addEdit(data);
    } catch {
      console.error('Failed to save edit');
    }
  };

  return (
    <div className="relative border rounded-lg bg-gray-100 overflow-auto flex justify-center p-4">
      <div 
        className="relative shadow-xl bg-white"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {image && (
          <img 
            src={image.src} 
            alt={`Page ${pageNumber}`} 
            className="absolute top-0 left-0"
            style={{ width: dimensions.width, height: dimensions.height }}
          />
        )}
        
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          className="absolute top-0 left-0"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            {edits.filter(e => e.page_number === pageNumber).map((edit) => (
              <React.Fragment key={edit.id}>
                {edit.edit_type === 'redact' ? (
                  <Rect
                    x={edit.x}
                    y={edit.y}
                    width={edit.width}
                    height={edit.height}
                    fill="black"
                  />
                ) : (
                  <>
                    <Rect
                      x={edit.x}
                      y={edit.y}
                      width={edit.width}
                      height={edit.height}
                      fill="white"
                    />
                    <KonvaText
                      x={edit.x}
                      y={edit.y}
                      text={edit.new_value || ''}
                      fontSize={14}
                      fill="black"
                    />
                  </>
                )}
              </React.Fragment>
            ))}
            
            {newRect && (
              <Rect
                x={newRect.x}
                y={newRect.y}
                width={newRect.width}
                height={newRect.height}
                fill={newRect.type === 'redact' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'}
                stroke="blue"
                strokeWidth={1}
              />
            )}
          </Layer>
        </Stage>
      </div>
      
      {/* Tool switcher */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white p-2 rounded shadow-md border">
        <button 
          onClick={() => setTool('select')}
          className={`p-2 rounded ${tool === 'select' ? 'bg-blue-100' : ''}`}
        >
          Select
        </button>
        <button 
          onClick={() => setTool('redact')}
          className={`p-2 rounded ${tool === 'redact' ? 'bg-blue-100' : ''}`}
        >
          Redact
        </button>
        <button 
          onClick={() => setTool('text')}
          className={`p-2 rounded ${tool === 'text' ? 'bg-blue-100' : ''}`}
        >
          Text
        </button>
      </div>
    </div>
  );
};
