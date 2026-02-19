'use client'

import { useState, useEffect, useRef } from 'react'

const COLOR_PRESETS = {
  blue: {
    bg: 'rgba(59,130,246,0.2)',
    border: '1px solid rgba(59,130,246,0.4)',
    activeBg: 'rgba(59,130,246,0.25)',
    activeText: 'rgba(147,197,253,1)',
  },
  purple: {
    bg: 'rgba(168,85,247,0.2)',
    border: '1px solid rgba(168,85,247,0.4)',
    activeBg: 'rgba(168,85,247,0.25)',
    activeText: 'rgba(216,180,254,1)',
  },
}

const DROPDOWN_STYLE = {
  background: 'rgba(15,15,20,0.92)',
  backdropFilter: 'blur(40px) saturate(200%)',
  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
}

export default function FilterDropdown({
  options,
  value,
  onChange,
  defaultValue = 'all',
  color = 'blue',
  dropdownWidth = 'w-48',
  dropdownAlign = 'left-0',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)
  const colors = COLOR_PRESETS[color] || COLOR_PRESETS.blue
  const isActive = value !== defaultValue
  const selected = options.find(o => o.id === value) || options[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer"
        style={{
          background: isActive ? colors.bg : 'rgba(255,255,255,0.08)',
          border: isActive ? colors.border : '1px solid rgba(255,255,255,0.15)',
          color: 'white',
          backdropFilter: 'blur(24px)',
        }}
      >
        {selected.icon && <span>{selected.icon}</span>}
        <span>{selected.label || selected.name}</span>
        <svg className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          className={`absolute top-full ${dropdownAlign} mt-2 ${dropdownWidth} rounded-2xl overflow-hidden py-1.5 z-50`}
          style={DROPDOWN_STYLE}
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setIsOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer"
              style={value === opt.id
                ? { background: colors.activeBg, color: colors.activeText }
                : { color: 'rgba(255,255,255,0.75)' }
              }
            >
              {opt.icon && <span>{opt.icon}</span>}
              <span>{opt.label || opt.name}</span>
              {value === opt.id && (
                <svg className="w-4 h-4 ml-auto" style={{ color: colors.activeText }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
