'use client'
import React, { useState, useRef, useEffect } from "react";
import { type Node } from "@xyflow/react";
import FSMGraph from "./FSMGraph";

// Types for the user states analysis JSON
interface UserStateAnalysis {
    folder: string;
    user_states: string[];
}

interface TimeMarker {
    time: number;
    node: Node;
}

export function VideoFlow() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [fired, setFired] = useState<Set<number>>(new Set());
    const [videoWidth, setVideoWidth] = useState(400);
    const [dragging, setDragging] = useState(false);
    const [markers, setMarkers] = useState<TimeMarker[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Load user states analysis data
    useEffect(() => {
        fetch('/user_states_analysis.json')
            .then(res => res.json())
            .then((data: UserStateAnalysis[]) => {
                // Parse timestamp from folder name (format: YYYYMMDD_HHMMSS-ManualSummary)
                const parseTimestamp = (folder: string): Date | null => {
                    const match = folder.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
                    if (!match) return null;
                    const [, year, month, day, hour, minute, second] = match;
                    return new Date(Date.UTC(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day),
                        parseInt(hour),
                        parseInt(minute),
                        parseInt(second)
                    ));
                };

                // Sort by timestamp
                const sortedData = [...data].sort((a, b) => {
                    const timeA = parseTimestamp(a.folder);
                    const timeB = parseTimestamp(b.folder);
                    if (!timeA || !timeB) return 0;
                    return timeA.getTime() - timeB.getTime();
                });

                // Get the first timestamp as the video start (time 0)
                const firstTimestamp = parseTimestamp(sortedData[0]?.folder);
                if (!firstTimestamp) {
                    console.error('Failed to parse first timestamp');
                    return;
                }

                // Transform the data into time markers
                const timeMarkers: TimeMarker[] = [];
                let nodeIdCounter = 1;
                
                sortedData.forEach((analysis, folderIdx) => {
                    const currentTimestamp = parseTimestamp(analysis.folder);
                    if (!currentTimestamp) return;

                    // Calculate relative time in seconds from the first timestamp
                    const relativeTimeSeconds = (currentTimestamp.getTime() - firstTimestamp.getTime()) / 1000;

                    analysis.user_states.forEach((state, stateIdx) => {
                        // Generate positions in a grid layout
                        const x = 100 + (stateIdx % 4) * 200;
                        const y = 100 + Math.floor(stateIdx / 4) * 100 + folderIdx * 50;
                        
                        timeMarkers.push({
                            time: relativeTimeSeconds,
                            node: {
                                id: `n${nodeIdCounter++}`,
                                position: { x, y },
                                data: { 
                                    label: state.replace(/_/g, ' '),
                                    folder: analysis.folder,
                                    timestamp: currentTimestamp.toISOString()
                                },
                                type: "default",
                            }
                        });
                    });
                });
                
                setMarkers(timeMarkers);
            })
            .catch(err => console.error('Failed to load user states:', err));
    }, []);

    const handleTimeUpdate = () => {
        const t = videoRef.current?.currentTime ?? 0;
        setCurrentTime(t);

        markers.forEach((m, idx) => {
            if (t >= m.time && !fired.has(idx)) {
                setNodes((nds) => [...nds, m.node]);
                setFired((prev) => {
                    const next = new Set(prev);
                    next.add(idx);
                    return next;
                });
            }
        });
    };

    const handleLoadedMetadata = () => {
        const dur = videoRef.current?.duration ?? 0;
        setDuration(dur);
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        videoRef.current.currentTime = percentage * duration;
    };

    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const newWidth = rect.right - e.clientX;
            setVideoWidth(Math.max(200, newWidth));
        };

        const handleMouseUp = () => {
            setDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging]);

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };


    return (
        <div
            ref={containerRef}
            style={{ display: "flex", gap: 0, height: "100vh" }}
        >
            <div style={{ flex: 1 }}>
                <FSMGraph externalNodes={nodes} />
            </div>

            <div
                onMouseDown={onMouseDown}
                style={{ width: 4, cursor: "col-resize", background: "#ccc" }}
            />
            
            <div style={{ width: videoWidth, display: 'flex', flexDirection: 'column' }}>
                {/* Timeline bar */}
                <div style={{ padding: '10px', background: '#1a1a1a' }}>
                    <div
                        onClick={handleTimelineClick}
                        style={{
                            position: 'relative',
                            height: '40px',
                            background: '#333',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Node markers */}
                        {markers.map((marker, idx) => {
                            const position = duration > 0 ? (marker.time / duration) * 100 : 0;
                            const isFired = fired.has(idx);
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        position: 'absolute',
                                        left: `${position}%`,
                                        top: 0,
                                        bottom: 0,
                                        width: '2px',
                                        background: isFired ? '#4ade80' : '#fbbf24',
                                        zIndex: 1,
                                    }}
                                    title={`${marker.node.data.label} at ${marker.time.toFixed(1)}s`}
                                />
                            );
                        })}
                        
                        {/* Current time indicator */}
                        <div
                            style={{
                                position: 'absolute',
                                left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                                top: 0,
                                bottom: 0,
                                width: '3px',
                                background: '#ef4444',
                                zIndex: 2,
                            }}
                        />
                        
                        {/* Progress bar */}
                        <div
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                                background: 'rgba(59, 130, 246, 0.3)',
                            }}
                        />
                    </div>
                    
                    {/* Time labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '12px', color: '#999' }}>
                        <span>{Math.floor(currentTime)}s</span>
                        <span>{Math.floor(duration)}s</span>
                    </div>
                </div>

                <video
                    ref={videoRef}
                    src="purple.mp4"
                    controls
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    style={{
                        width: '100%',
                        flex: 1,
                        pointerEvents: dragging ? 'none' : 'auto'
                    }}
                />
            </div>
        </div>
    );
}

