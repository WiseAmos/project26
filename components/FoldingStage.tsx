'use client'

import React, { useState, useEffect, useRef } from 'react'
import { PaperFoldingEngine } from './PaperFoldingEngine'

interface FoldingStageProps {
    onComplete?: () => void
    onDragStart?: () => void
    forceFinish?: boolean
    onProgressChange?: (step: number, progress: number, isComplete: boolean) => void
    isReleasing?: boolean
}

export default function FoldingStage({ onComplete, onDragStart, forceFinish, onProgressChange, isReleasing }: FoldingStageProps) {
    const [step, setStep] = useState(0) // 0: Square, 1: Triangle, 2: Diamond, 3: BirdBase, 4: Crane
    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    // Report progress to parent
    useEffect(() => {
        if (onProgressChange) {
            onProgressChange(step, progress, isComplete)
        }
    }, [step, progress, isComplete, onProgressChange])

    // Force finish state if mode dictates (prevents reset on remount)
    useEffect(() => {
        if (forceFinish) {
            setStep(3)
            setProgress(1)
            setIsComplete(true)
        }
    }, [forceFinish])

    // Track drag
    const startX = useRef(0)
    const isDragging = useRef(false)

    useEffect(() => {
        const handleDown = (e: MouseEvent | TouchEvent) => {
            if (isComplete) return

            isDragging.current = true
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
            startX.current = clientX
            if (onDragStart) onDragStart()
        }

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (isDragging.current && !isComplete) {
                const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
                const delta = clientX - startX.current

                // Drag Sensitivity
                const sensitivity = 0.005
                const newProgress = Math.min(Math.max(delta * sensitivity, 0), 1)

                setProgress(newProgress)

                if (newProgress >= 0.99) {
                    // Logic to advance steps
                    const nextStep = step + 1

                    // Artificial delay/snap for feel
                    if (step < 3) {
                        setProgress(1)
                        isDragging.current = false
                        setTimeout(() => {
                            setStep(nextStep)
                            setProgress(0)
                        }, 200)
                    } else if (step === 3) {
                        // Finished Folding
                        setIsComplete(true)
                        if (onComplete) onComplete()
                    }
                }
            }
        }

        const handleUp = () => {
            isDragging.current = false
            // Snap back if released early
            if (progress < 0.99 && !isComplete) {
                setProgress(0)
            }
        }

        window.addEventListener('mousedown', handleDown)
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        window.addEventListener('touchstart', handleDown)
        window.addEventListener('touchmove', handleMove)
        window.addEventListener('touchend', handleUp)

        return () => {
            window.removeEventListener('mousedown', handleDown)
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('touchstart', handleDown)
            window.removeEventListener('touchmove', handleMove)
            window.removeEventListener('touchend', handleUp)
        }
    }, [isComplete, progress, step, onComplete, onDragStart])

    // Pure 3D content - no Html overlay (handled by parent page.tsx now)
    return <PaperFoldingEngine step={step} progress={progress} isReleasing={isReleasing} />
}
