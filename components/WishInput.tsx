'use client'

import { useState, useRef, useEffect } from 'react'
import { useConfig } from './ConfigContext'

interface WishInputProps {
    onSend: (message: string) => void
    onColorChange: (color: string) => void
    selectedColor: string
}

export default function WishInput({ onSend, onColorChange, selectedColor }: WishInputProps) {
    const { config } = useConfig()
    const [message, setMessage] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const [isActive, setIsActive] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)

    // TYPEWRITER EFFECT
    const fullPlaceholder = config.craneColors.find(c => c.color === selectedColor)?.placeholder
        || config.instructions.wishPlaceholder
        || "Tap here to write your unspoken wish..."


    useEffect(() => {
        // Auto-focus after a longer delay (4.5s) if no interaction
        const timer = setTimeout(() => {
            if (!hasInteracted && inputRef.current) {
                inputRef.current.focus()
                setIsActive(true)
            }
        }, 4500)

        // Initial fade in
        const fadeTimer = setTimeout(() => setIsActive(true), 1000)

        return () => {
            clearTimeout(timer)
            clearTimeout(fadeTimer)
        }
    }, [hasInteracted])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && message.trim().length > 0) {
            handleSubmit()
        }
    }

    const handleSubmit = () => {
        if (message.trim().length === 0) return
        setIsActive(false) // Fade out UI
        onSend(message) // Trigger release animation
    }

    return (
        <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-between py-[8vh] z-20 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ pointerEvents: 'none' }}>

            {/* TOP: INPUT FIELD */}
            <div className="w-full max-w-lg px-6 flex flex-col items-center gap-4 pointer-events-auto mt-4 md:mt-0">
                <div
                    className="relative w-full group bg-white/20 backdrop-blur-sm rounded-xl p-1 transition-all duration-500 hover:bg-white/30 border border-white/10 hover:border-white/30 animate-subtle-pulse"
                    style={{ '--pulse-color': selectedColor + '40' } as React.CSSProperties} // 40 = 25% opacity hex
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onFocus={() => setHasInteracted(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={fullPlaceholder}
                        className="w-full bg-transparent text-[#333] text-center font-serif text-xl md:text-2xl placeholder:text-[#333]/30 outline-none border-none focus:ring-0 transition-all duration-700 p-4"
                        autoComplete="off"
                    />
                </div>
                <p className={`mt-1 text-[10px] tracking-[0.2em] uppercase text-[#333]/30 transition-opacity duration-700 ${message.trim().length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                    Press Enter to Release
                </p>
            </div>

            {/* BOTTOM: PALETTE */}
            <div className="w-full max-w-lg px-6 flex flex-col items-center gap-8 pointer-events-auto mb-12">
                {/* EMOTIONAL PALETTE */}
                <div className="flex items-center gap-6">
                    {config.craneColors.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onColorChange(item.color)}
                            className="group relative flex flex-col items-center gap-2"
                            title={item.label}
                        >
                            <div
                                className={`w-8 h-8 rounded-full transition-all duration-300 shadow-sm border ${selectedColor === item.color ? 'scale-110 ring-2 ring-gray-400 border-transparent' : 'scale-100 border-black/10 group-hover:scale-105'}`}
                                style={{ backgroundColor: item.color }}
                            />
                            <span className={`absolute -bottom-6 text-[9px] uppercase tracking-widest text-[#333]/50 whitespace-nowrap opacity-0 transition-opacity duration-300 ${selectedColor === item.color ? 'opacity-100' : 'group-hover:opacity-100'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>


            </div>
        </div>
    )
}
