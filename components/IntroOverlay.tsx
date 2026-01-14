'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface IntroProps {
    onComplete: () => void
    onGallery: () => void
}

export default function IntroOverlay({ onComplete, onGallery }: IntroProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const textRef1 = useRef<HTMLParagraphElement>(null)
    const textRef2 = useRef<HTMLParagraphElement>(null)
    const textRef3 = useRef<HTMLParagraphElement>(null)
    const textRef4 = useRef<HTMLParagraphElement>(null)

    useEffect(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                // Fade out the black container
                gsap.to(containerRef.current, {
                    opacity: 0,
                    duration: 2,
                    ease: 'power2.inOut',
                    onComplete: onComplete
                })
            }
        })

        // Initial Set
        gsap.set([textRef1.current, textRef2.current, textRef3.current, textRef4.current], { autoAlpha: 0, y: 20 })

        // Sequence
        // 0s: Legend...
        tl.to(textRef1.current, { autoAlpha: 1, y: 0, duration: 2 })
            .to(textRef1.current, { autoAlpha: 0, y: -20, duration: 1.5, delay: 1.5 })

        // 3s: I am not...
        tl.to(textRef2.current, { autoAlpha: 1, y: 0, duration: 2 }, "-=0.5")
            .to(textRef2.current, { autoAlpha: 0, y: -20, duration: 1.5, delay: 1.5 })

        // 6s: To grieve...
        tl.to(textRef3.current, { autoAlpha: 1, y: 0, duration: 2 }, "-=0.5")
            .to(textRef3.current, { autoAlpha: 0, y: -20, duration: 1.5, delay: 1.5 })

        // 8s: To fold...
        tl.to(textRef4.current, { autoAlpha: 1, y: 0, duration: 2 }, "-=0.5")
            .to(textRef4.current, { autoAlpha: 0, y: -20, duration: 1.5, delay: 2 })

        return () => {
            tl.kill()
        }
    }, [onComplete])

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-[#f4f1ea] z-[50] overflow-hidden"
        >
            <div className="relative w-full max-w-xl h-40 flex items-center justify-center text-[#333]">
                <p ref={textRef1} className="absolute inset-0 flex items-center justify-center text-center text-lg md:text-2xl font-light tracking-wider opacity-0 px-4">
                    Legend says that folding one thousand paper cranes grants a single wish.
                </p>
                <p ref={textRef2} className="absolute inset-0 flex items-center justify-center text-center text-xl md:text-3xl font-medium tracking-wide opacity-0 px-4">
                    I am not folding for a wish.
                </p>
                <p ref={textRef3} className="absolute inset-0 flex items-center justify-center text-center text-xl md:text-3xl font-medium tracking-wide opacity-0 px-4">
                    To grieve in silence is to drown.
                </p>
                <p ref={textRef4} className="absolute inset-0 flex items-center justify-center text-center text-2xl md:text-4xl font-bold tracking-widest uppercase opacity-0 px-4">
                    To fold is to breathe.
                </p>
            </div>

            <button
                onClick={onGallery}
                style={{ position: 'fixed', top: '2.5rem', right: '3rem', left: 'auto' }}
                className="group flex items-center justify-center gap-2 z-[60] cursor-pointer"
            >
                <span className="font-serif italic text-lg text-[#333]/80 group-hover:text-[#333] transition-colors duration-500">
                    view gallery
                </span>
                <div className="w-8 h-[1px] bg-[#333]/30 group-hover:w-12 group-hover:bg-[#333] transition-all duration-500"></div>
            </button>
        </div>
    )
}
