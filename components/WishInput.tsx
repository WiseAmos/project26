'use client'

import { useState, useRef, useEffect } from 'react'

interface WishInputProps {
    onSend: (message: string) => void
}

export default function WishInput({ onSend }: WishInputProps) {
    const [message, setMessage] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const [isActive, setIsActive] = useState(false)

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
        <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-start pt-[8vh] z-20 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ pointerEvents: 'none' }}>
            <div className="w-full max-w-lg px-6 flex flex-col items-center gap-4 pointer-events-auto">

                <div className="relative w-full group mt-8 bg-white/20 backdrop-blur-sm rounded-xl p-1 transition-all duration-500 hover:bg-white/30 border border-white/10 hover:border-white/30">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Write your unwished wish..."
                        className="w-full bg-transparent text-[#333] text-center font-serif text-xl md:text-2xl placeholder:text-[#333]/30 outline-none border-none focus:ring-0 transition-all duration-700 p-4"
                        autoComplete="off"
                    />
                </div>

                <p className={`text-[10px] tracking-[0.2em] uppercase text-[#333]/30 transition-opacity duration-700 ${message.trim().length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                    Press Enter to Release
                </p>
            </div>
        </div>
    )
}
