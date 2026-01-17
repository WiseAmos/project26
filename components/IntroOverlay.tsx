import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useConfig } from './ConfigContext'
import type { IntroStep } from './ConfigContext'

interface IntroProps {
    onComplete: () => void
    onGallery: () => void
}

export default function IntroOverlay({ onComplete, onGallery }: IntroProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const textsRef = useRef<(HTMLParagraphElement | null)[]>([])
    const { config } = useConfig()
    // LOCK-IN STRATEGY:
    // Capture the intro sequence ONCE on mount.
    // Even if config updates in the background (Firestore connection),
    // we ignore it to prevent the animation from restarting or jittering.
    const [sequence] = useState<IntroStep[]>(config.introSequence)

    useEffect(() => {
        if (!sequence || sequence.length === 0) {
            onComplete()
            return
        }

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

        // Initial Set: Hide all texts
        textsRef.current.forEach(el => {
            if (el) gsap.set(el, { autoAlpha: 0, y: 20 })
        })

        // Build Sequence Dynamically
        sequence.forEach((step, index) => {
            const el = textsRef.current[index]
            if (!el) return

            const position = index === 0 ? undefined : "-=0.5" // Overlap all except first

            // Fade In
            tl.to(el, {
                autoAlpha: 1,
                y: 0,
                duration: step.duration
            }, position)

            // Hold then Fade Out
            tl.to(el, {
                autoAlpha: 0,
                y: -20,
                duration: 1.5,
                delay: step.hold
            })
        })

        return () => {
            tl.kill()
        }
    }, []) // Empty dependency = Run ONCE on mount. Never restart.

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-[#f4f1ea] z-[50] overflow-hidden"
        >
            <div className="relative w-full max-w-xl h-40 flex items-center justify-center text-[#333]">
                {sequence.map((step, i) => (
                    <p
                        key={i}
                        ref={el => { textsRef.current[i] = el }}
                        className={`absolute inset-0 flex items-center justify-center text-center px-4 opacity-0
                            ${step.highlight
                                ? "text-xl md:text-2xl font-bold tracking-widest uppercase"
                                : "text-lg md:text-xl font-medium tracking-wide"
                            }
                            ${!step.highlight && i === 0 ? "font-light tracking-wider text-base md:text-lg" : ""}
                        `}
                    >
                        {step.text}
                    </p>
                ))}
            </div>

            <button
                onClick={onGallery}
                style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999 }}
                className="group flex items-center gap-3 cursor-pointer bg-transparent border-none shadow-none outline-none p-0 m-0"
            >
                <span className="font-serif italic text-lg text-[#333]/60 group-hover:text-[#333] transition-colors duration-500">
                    view gallery
                </span>
                <div className="w-8 h-[1px] bg-[#333]/30 group-hover:w-12 group-hover:bg-[#333] transition-all duration-500"></div>
            </button>
        </div>
    )
}
// Removed helper function as logic is simplified
