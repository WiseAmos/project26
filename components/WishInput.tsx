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

    // EMOTIONAL THEMES MAPPING
    const EMOTION_DATA: Record<string, { title: string, subtitle: string, placeholder: string }> = {
        '#808080': { // Grey
            title: "The Unsent",
            subtitle: "For the words that dissolved in the silence.",
            placeholder: "Write the message you typed, stared at, and deleted..."
        },
        '#A4C2F4': { // Blue
            title: "The Regret",
            subtitle: "For the good intentions that were misunderstood.",
            placeholder: "What would you do differently if you had one more chance?"
        },
        '#E06666': { // Red
            title: "The Yearning",
            subtitle: "For the love that has nowhere to go.",
            placeholder: "Tell them you miss them, even if you aren't allowed to."
        },
        '#000000': { // Black
            title: "The Closure",
            subtitle: "For the ending you had to write yourself.",
            placeholder: "Say the goodbye they never gave you. Let it go."
        }
    }

    const currentTheme = EMOTION_DATA[selectedColor] || {
        title: "Make a Wish",
        subtitle: "Send your unspoken words into the void.",
        placeholder: config.instructions.wishPlaceholder || "Write your wish..."
    }

    useEffect(() => {
        // Auto-focus after a delay
        const timer = setTimeout(() => {
            setIsActive(true)
            inputRef.current?.focus()
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

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
            <div className="w-full max-w-xl px-6 flex flex-col items-center gap-6 pointer-events-auto mt-4 md:mt-0">

                {/* DYNAMIC HEADER */}
                <div className="text-center space-y-2 animate-fade-in">
                    <h2 className="text-2xl md:text-3xl font-serif italic text-[#333] transition-all duration-500">
                        {currentTheme.title}
                    </h2>
                    <p className="text-xs md:text-sm text-[#333]/50 tracking-wide font-medium transition-all duration-500 min-h-[1.5em]">
                        {currentTheme.subtitle}
                    </p>
                </div>

                <div className="relative w-full group bg-white/40 backdrop-blur-md rounded-2xl p-6 transition-all duration-500 hover:bg-white/60 border border-white/20 shadow-sm hover:shadow-md">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={currentTheme.placeholder}
                        className="w-full bg-transparent text-[#333] text-center font-serif text-lg md:text-xl placeholder:text-[#333]/30 outline-none border-none focus:ring-0 transition-all duration-500 placeholder:italic"
                        autoComplete="off"
                    />
                </div>
                <p className={`mt-2 text-[9px] tracking-[0.25em] uppercase text-[#333]/40 transition-opacity duration-700 ${message.trim().length > 0 ? 'opacity-100' : 'opacity-0'}`}>
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
