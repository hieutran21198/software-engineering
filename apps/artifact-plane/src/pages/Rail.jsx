import React from 'react';

// Resizable details rail divider for the graph, unit and change pages.
export function RailDivider({width, max, min = 240, onResize, controls, edge}) {
  const keyboard = event => {
    const widths = {ArrowLeft: width + 20, ArrowRight: width - 20, Home: min, End: max};
    if (Object.hasOwn(widths, event.key)) {event.preventDefault();onResize(widths[event.key]);}
  };
  const release = event => {if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);};
  return <div className="rail-divider" role="separator" aria-label="Resize details panel" aria-orientation="vertical" aria-valuemin={min} aria-valuemax={max} aria-valuenow={width} aria-controls={controls} tabIndex={0}
    onKeyDown={keyboard}
    onPointerDown={event => {if (event.button !== 0) return;event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);}}
    onPointerMove={event => {if (event.currentTarget.hasPointerCapture(event.pointerId)) onResize(edge() - event.clientX);}}
    onPointerUp={release} onPointerCancel={release}/>;
}
