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
        <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-start pt-[15vh] z-20 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ pointerEvents: 'none' }}>
            <div className="w-full max-w-2xl px-8 flex flex-col items-center gap-8 pointer-events-auto">

                <div className="relative w-full group mt-12 bg-white/20 backdrop-blur-sm rounded-2xl p-2 transition-all duration-500 hover:bg-white/30">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333]/40">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Write your unwished wish..."
                        className="w-full bg-transparent text-[#333] text-center font-serif text-2xl md:text-3xl placeholder:text-[#333]/30 outline-none border-none focus:ring-0 transition-all duration-700 pl-10 pr-10"
                        autoComplete="off"
                    />

                    {/* Minimal Release Icon */}
                    <button
                        onClick={handleSubmit}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 text-[#333] opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all duration-500 transform ${message.trim().length > 0 ? 'translate-x-0 opacity-60' : 'translate-x-4 pointer-events-none'}`}
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
