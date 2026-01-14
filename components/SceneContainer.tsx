'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const Scene = dynamic(() => import('./Scene'), { ssr: false })

export default function SceneContainer() {
    const router = useRouter()

    const handleComplete = () => {
        router.push('/gallery')
    }

    return (
        <div className="w-full h-full">
            <Scene onComplete={handleComplete} />
        </div>
    )
}
