'use client'

import { useState, useEffect } from 'react'

export default function FadingText({ text, className = "" }: { text: string, className?: string }) {
    const [display, setDisplay] = useState(text)
    const [opacity, setOpacity] = useState(1)

    useEffect(() => {
        if (text !== display) {
            setOpacity(0) // Fade out
            const timer = setTimeout(() => {
                setDisplay(text)
                setOpacity(1) // Fade in
            }, 300) // 300ms matches standard transition duration
            return () => clearTimeout(timer)
        }
    }, [text, display])

    return (
        <span
            className={`transition-opacity duration-300 ease-in-out block ${className}`}
            style={{ opacity }}
        >
            {display}
        </span>
    )
}
