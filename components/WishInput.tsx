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
        <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-start pt-32 z-20 transition-opacity duration-1000 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="w-full max-w-2xl px-8 flex flex-col items-center gap-8">

                <div className="relative w-full group">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Write your unwished wish..."
                        className="w-full bg-transparent text-[#333] text-center font-serif text-2xl md:text-3xl placeholder:text-[#333]/30 outline-none border-b border-[#333]/20 py-4 focus:border-[#333]/60 transition-all duration-700"
                        autoComplete="off"
                    />

                    {/* Minimal Release Icon */}
                    <button
                        onClick={handleSubmit}
                        className={`absolute right-0 bottom-4 text-[#333] opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all duration-500 transform ${message.trim().length > 0 ? 'translate-x-0 opacity-60' : 'translate-x-4 pointer-events-none'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    className={`mt-4 text-[10px] tracking-[0.3em] uppercase text-[#333]/40 hover:text-[#333] transition-colors duration-700 ${message.trim().length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transform`}
                >
                    Release
                </button>
            </div>
        </div>
    )
}
