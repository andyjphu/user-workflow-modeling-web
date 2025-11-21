'use client'
import React, { useState, useRef, useEffect } from "react";
import { type Node, type Edge, MarkerType } from "@xyflow/react";
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

interface Transition {
    trigger: string;
    source: string;
    dest: string;
}

export function VideoFlow() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [fired, setFired] = useState<Set<number>>(new Set());
    const [videoWidth, setVideoWidth] = useState(400);
    const [dragging, setDragging] = useState(false);
    const [markers, setMarkers] = useState<TimeMarker[]>([]);
    const [transitions, setTransitions] = useState<Transition[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Load transitions data
    useEffect(() => {
        fetch('/transitions.json')
            .then(res => res.json())
            .then((data: Transition[]) => {
                // Deduplicate transitions by (source, dest, trigger) tuple
                const seen = new Set<string>();
                const uniqueTransitions: Transition[] = [];
                
                data.forEach(transition => {
                    const key = `${transition.source}|${transition.dest}|${transition.trigger}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueTransitions.push(transition);
                    }
                });
                
                console.log('Loaded transitions:', uniqueTransitions.length, 'unique out of', data.length, 'total');
                setTransitions(uniqueTransitions);
            })
            .catch(err => console.error('Failed to load transitions:', err));
    }, []);

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

                // Transform the data into time markers with deduplication
                const timeMarkers: TimeMarker[] = [];
                const seenStates = new Map<string, number>(); // Track state -> earliest time
                
                sortedData.forEach((analysis, folderIdx) => {
                    const currentTimestamp = parseTimestamp(analysis.folder);
                    if (!currentTimestamp) return;

                    // Calculate relative time in seconds from the first timestamp
                    const relativeTimeSeconds = (currentTimestamp.getTime() - firstTimestamp.getTime()) / 1000;

                    // Deduplicate states within this folder's array
                    const uniqueStates = [...new Set(analysis.user_states)];

                    uniqueStates.forEach((state, stateIdx) => {
                        // Check if we've seen this state before
                        if (seenStates.has(state)) {
                            // State already exists, skip it
                            return;
                        }

                        // Mark this state as seen with its timestamp
                        seenStates.set(state, relativeTimeSeconds);

                        // Generate positions in a grid layout
                        const totalStates = seenStates.size;
                        const x = 100 + ((totalStates - 1) % 4) * 200;
                        const y = 100 + Math.floor((totalStates - 1) / 4) * 100;
                        
                        timeMarkers.push({
                            time: relativeTimeSeconds,
                            node: {
                                id: state, // Use state name as ID for edge connections
                                position: { x, y },
                                data: { 
                                    label: state.replace(/_/g, ' '),
                                    folder: analysis.folder,
                                    timestamp: currentTimestamp.toISOString(),
                                    state: state
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

        // Also update duration if it's not set yet (fallback)
        if (duration === 0 && videoRef.current?.duration) {
            setDuration(videoRef.current.duration);
        }

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
        console.log('Video duration loaded:', dur);
        setDuration(dur);
    };

    const handleCanPlay = () => {
        // Backup: ensure duration is set when video can play
        if (duration === 0 && videoRef.current?.duration) {
            console.log('Setting duration from canplay:', videoRef.current.duration);
            setDuration(videoRef.current.duration);
        }
        
        // Debug audio
        if (videoRef.current) {
            const video = videoRef.current as any;
            console.log('Video audio properties:', {
                muted: videoRef.current.muted,
                volume: videoRef.current.volume,
                audioTracks: video.audioTracks?.length,
                hasAudio: video.mozHasAudio || video.webkitAudioDecodedByteCount > 0
            });
        }
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

    // Debug: log duration changes
    useEffect(() => {
        console.log('Duration state updated:', duration);
    }, [duration]);

    // Debug: log markers
    useEffect(() => {
        console.log('Markers loaded:', markers.length, 'markers');
        if (markers.length > 0) {
            console.log('First marker time:', markers[0].time);
            console.log('Last marker time:', markers[markers.length - 1].time);
        }
    }, [markers]);

    // Update edges when nodes change
    useEffect(() => {
        if (transitions.length === 0 || nodes.length === 0) return;

        // Get set of current node states
        const nodeStates = new Set(nodes.map(node => node.data.state).filter(Boolean));
        
        // Group transitions by source-dest pair to detect duplicates
        const edgeGroups = new Map<string, Transition[]>();
        
        transitions.forEach(transition => {
            if (nodeStates.has(transition.source) && nodeStates.has(transition.dest)) {
                const key = `${transition.source}->${transition.dest}`;
                if (!edgeGroups.has(key)) {
                    edgeGroups.set(key, []);
                }
                edgeGroups.get(key)!.push(transition);
            }
        });
        
        // Create edges with offsets for multiple edges between same nodes
        const newEdges: Edge[] = [];
        let edgeCounter = 0;
        
        edgeGroups.forEach((transitionGroup, key) => {
            const count = transitionGroup.length;
            
            transitionGroup.forEach((transition, index) => {
                // Calculate offset for multiple edges between same pair
                let offset = 0;
                if (count > 1) {
                    // Distribute offsets symmetrically: [-2, -1, 0, 1, 2] for 5 edges
                    const step = 0.5;
                    offset = (index - (count - 1) / 2) * step;
                }
                
                const edge: any = {
                    id: `e-${edgeCounter++}`,
                    source: transition.source,
                    target: transition.dest,
                    label: transition.trigger,
                    animated: true,
                    style: { strokeWidth: 1.5 },
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                };
                
                // Add pathOptions for offset (React Flow 12+)
                if (offset !== 0) {
                    edge.pathOptions = { offset };
                }
                
                newEdges.push(edge);
            });
        });
        
        console.log('Created edges:', newEdges.length, 'out of', transitions.length, 'total transitions');
        setEdges(newEdges);
    }, [nodes, transitions]);

    // Ensure video audio is properly initialized and check audio devices
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Check available audio output devices
        const checkAudioDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
                console.log('Available audio output devices:', audioOutputs);
                console.log('Current video sinkId:', (video as any).sinkId || 'default');
                
                if (audioOutputs.length > 1) {
                    console.log('⚠️ Multiple audio outputs detected! Audio might be playing on a different device.');
                    console.log('To change audio output, use browser settings or click the video.');
                }
            } catch (err) {
                console.warn('Could not enumerate audio devices:', err);
            }
        };

        // Wait a bit for video to load
        const timeout = setTimeout(() => {
            console.log('Checking video audio state:', {
                muted: video.muted,
                volume: video.volume,
                paused: video.paused
            });
            
            // Ensure video is not muted
            if (video.muted) {
                console.warn('Video was muted, attempting to unmute...');
                video.muted = false;
            }
            
            // Ensure volume is up
            if (video.volume === 0) {
                console.warn('Video volume was 0, setting to 1...');
                video.volume = 1.0;
            }

            checkAudioDevices();
        }, 1000);

        return () => clearTimeout(timeout);
    }, []);

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
                <FSMGraph externalNodes={nodes} externalEdges={edges} />
            </div>

            <div
                onMouseDown={onMouseDown}
                style={{ width: 4, cursor: "col-resize", background: "#ccc" }}
            />
            
            <div style={{ width: videoWidth, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Dragging overlay to prevent video interaction during resize */}
                {dragging && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1000,
                        cursor: 'col-resize'
                    }} />
                )}
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
                    src="/tutorial.mp4"
                    controls
                    controlsList="nodownload"
                    playsInline
                    preload="metadata"
                    onPlay={() => {
                        if (videoRef.current) {
                            console.log('Video playing, audio state:', {
                                muted: videoRef.current.muted,
                                volume: videoRef.current.volume,
                                sinkId: (videoRef.current as any).sinkId
                            });
                        }
                    }}
                    onVolumeChange={() => {
                        if (videoRef.current) {
                            console.log('✅ Volume changed:', {
                                muted: videoRef.current.muted,
                                volume: videoRef.current.volume
                            });
                        }
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onCanPlay={handleCanPlay}
                    onDurationChange={handleLoadedMetadata}
                    style={{
                        width: '100%',
                        flex: 1,
                        display: 'block',
                        backgroundColor: '#000'
                    }}
                />
            </div>
        </div>
    );
}

