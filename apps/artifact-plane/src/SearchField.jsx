import React, {useId, useRef} from 'react';

export {normalizeName, matchesName} from './names.js';

export default function SearchField({label, value, onChange, onSubmit, placeholder = 'Title or ID', submit = false}) {
  const id = useId(), input = useRef(null);
  return <form className="named-search" onSubmit={event => {event.preventDefault(); onSubmit?.();}}>
    <label htmlFor={id}>{label}</label>
    <div className="named-search-input">
      <input ref={input} id={id} value={value} placeholder={placeholder} autoComplete="off" onChange={event => onChange(event.target.value)}/>
      <button type="button" aria-label="Clear search" disabled={!value} onClick={() => {onChange(''); input.current?.focus();}}>Clear</button>
    </div>
    {submit && <button type="submit">Search</button>}
  </form>;
}
