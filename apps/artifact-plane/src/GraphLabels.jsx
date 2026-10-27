import React, {useLayoutEffect, useRef} from 'react';
import {BaseEdge, Controls, ControlButton, EdgeLabelRenderer, getSmoothStepPath, useNodes, useEdges,
 useViewport, useReactFlow, useStore} from '@xyflow/react';
import {placeLabels} from './label-placement.js';

// Only label presentation uses the upper HTML layer; edge paths retain their order.
// A routed edge follows the points of its layout, rounded at each bend.
function routedPath(points) {
 const mid = (a,b) => `${(a.x+b.x)/2} ${(a.y+b.y)/2}`;
 return `M ${points[0].x} ${points[0].y}` + points.slice(1,-1).map((p,i) =>
  ` Q ${p.x} ${p.y} ${mid(p, points[i+2])}`).join('') +
  ` L ${points.at(-1).x} ${points.at(-1).y}`;
}
export function LabelledEdge(props) {
 const routed = props.data?.points?.length > 1;
 const [path, x, y] = routed ? [routedPath(props.data.points), props.data.labelX, props.data.labelY]
  : getSmoothStepPath(props);
 const text = String(props.label || '');
 return <>
  <BaseEdge id={props.id} path={path} style={props.style}
   markerEnd={props.markerEnd} markerStart={props.markerStart}
   interactionWidth={props.interactionWidth}/>
  {text && <EdgeLabelRenderer>
   <div className="safe-edge-label" data-edge-id={props.id}
    data-anchor-x={x} data-anchor-y={y} style={{visibility:'hidden'}}>
    {text.length > 240 ? <details className="safe-edge-disclosure nodrag nopan">
     <summary>{text.slice(0,80)}…</summary><p>{text}</p>
    </details> : text}
   </div>
   <svg aria-hidden="true" className="safe-edge-leader" data-leader-id={props.id}><path/></svg>
  </EdgeLabelRenderer>}
 </>;
}
export const labelledEdgeTypes = {readable:LabelledEdge};

function drawLeader(svg, label, placed) {
 const x = placed.x + placed.width / 2, y = placed.y + placed.height / 2;
 const left = Math.min(x, label.x), top = Math.min(y, label.y);
 svg.style.transform = `translate(${left}px,${top}px)`;
 svg.setAttribute('width', Math.max(1, Math.abs(x-label.x)));
 svg.setAttribute('height', Math.max(1, Math.abs(y-label.y)));
 svg.querySelector('path').setAttribute('d',
  `M ${label.x-left} ${label.y-top} L ${x-left} ${y-top}`);
}

export function GraphLabelLayout() {
 const anchor = useRef(null), nodes = useNodes(), edges = useEdges();
 const viewport = useViewport(), {fitBounds} = useReactFlow();
 const width = useStore(s => s.width), height = useStore(s => s.height);
 const fitted = useRef(''), refit = useRef(null);
 useLayoutEffect(() => {
  const root = anchor.current?.closest('.react-flow');
  if (!root) return;
  let frame;
  const layout = () => {
   cancelAnimationFrame(frame);
   frame = requestAnimationFrame(() => {
    const origin = root.getBoundingClientRect(), z = viewport.zoom;
    if (!origin.width || !origin.height) return;
    const round = n => Math.round(n*100)/100;
    const local = r => ({
     x:round((r.left-origin.left-viewport.x)/z),
     y:round((r.top-origin.top-viewport.y)/z),
     width:round(r.width/z), height:round(r.height/z),
    });
    const obstacles = [...root.querySelectorAll('.react-flow__node')]
     .map(el => local(el.getBoundingClientRect()));
    const elements = [...root.querySelectorAll('.safe-edge-label')]
     .sort((a,b) => a.dataset.edgeId.localeCompare(b.dataset.edgeId));
    // Offset sizes remain stable across viewport scaling and pixel rounding.
    const labels = elements.map(el => ({
     id:el.dataset.edgeId, x:+el.dataset.anchorX, y:+el.dataset.anchorY,
     width:el.offsetWidth, height:el.offsetHeight,
    }));
    const placed = placeLabels(labels, obstacles);
    const leaders = new Map([...root.querySelectorAll('.safe-edge-leader')]
     .map(el => [el.dataset.leaderId, el]));
    placed.forEach((p,i) => {
     elements[i].style.transform = `translate(${p.x}px,${p.y}px)`;
     elements[i].style.visibility = 'visible';
     const leader = leaders.get(p.id);
     if (leader) drawLeader(leader, labels[i], p);
    });
    // Fit label bounds initially and on resize. Expansion preserves the user viewport.
    const signature = `${width}:${height}`;
    const fit = () => {
     if (!obstacles.length || !root.isConnected) return;
     const all = [...obstacles,...placed];
     const x = Math.min(...all.map(r => r.x)), y = Math.min(...all.map(r => r.y));
     const right = Math.max(...all.map(r => r.x+r.width));
     const bottom = Math.max(...all.map(r => r.y+r.height));
     fitBounds({x,y,width:right-x,height:bottom-y},{padding:.2,duration:0});
    };
    refit.current = fit;
    if (signature !== fitted.current) { fitted.current = signature; fit(); }
   });
  };
  const observer = new ResizeObserver(layout);
  observer.observe(root);
  root.querySelectorAll('.react-flow__node,.safe-edge-label')
   .forEach(el => observer.observe(el));
  layout();
  return () => { cancelAnimationFrame(frame); observer.disconnect(); };
 }, [nodes,edges,width,height,viewport.x,viewport.y,viewport.zoom,fitBounds]);
 return <><span ref={anchor} className="sr-only"/>
  <Controls showInteractive={false} showFitView={false}><ControlButton
   className="react-flow__controls-fitview" aria-label="Fit View" title="Fit View"
   onClick={() => refit.current?.()}><svg viewBox="0 0 16 16"><path fill="currentColor" d="M1 1h5v2H3v3H1zm9 0h5v5h-2V3h-3zM1 10h2v3h3v2H1zm12 0h2v5h-5v-2h3z"/></svg></ControlButton></Controls></>;
}
