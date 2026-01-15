'use client'

import React, { useMemo } from 'react'
import { ComposableMap, Geographies, Geography, Sphere, Graticule, ZoomableGroup } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'

// Standard topojson for world countries
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

interface MapProps {
    data?: { name: string; count: number }[]
    recentVisits?: any[]
}

export default function AnalyticsMap({ data = [], recentVisits = [] }: MapProps) {
    // Calculate Live Users (active < 5 mins ago)
    const liveCount = useMemo(() => {
        const fiveMinsAgo = Date.now() - 5 * 60 * 1000
        return recentVisits.filter(v => new Date(v.timestamp).getTime() > fiveMinsAgo).length
    }, [recentVisits])

    // Live Countries Set
    const liveCountries = useMemo(() => {
        const fiveMinsAgo = Date.now() - 5 * 60 * 1000
        const active = recentVisits.filter(v => new Date(v.timestamp).getTime() > fiveMinsAgo)
        return new Set(active.map(v => v.country)) // e.g. "US", "JP"
    }, [recentVisits])

    const colorScale = scaleLinear<string>()
        .domain([0, Math.max(...data.map(d => d.count), 1)])
        .range(["#f4f1ea", "#FF5555"])

    return (
        <div className="relative w-full h-96 bg-[#f9fafb] rounded-lg overflow-hidden border border-gray-200">
            {/* LIVE BADGE */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                <div className="relative flex h-3 w-3">
                    {liveCount > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${liveCount > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                </div>
                <span className="text-xs font-bold text-gray-700">
                    {liveCount} Live
                </span>
            </div>

            <ComposableMap
                projectionConfig={{
                    scale: 150,
                    rotation: [-11, 0, 0],
                }}
            >
                <ZoomableGroup center={[0, -40]}>
                    <Sphere stroke="#E4E5E6" strokeWidth={0.5} id="sphere" fill="transparent" />
                    <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const d = data.find((s) => s.name === geo.properties.name || s.name === geo.id)
                                const isLive = liveCountries.has(d?.name) || liveCountries.has(geo.properties.name)

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={isLive ? "#86efac" : (d ? colorScale(d.count) : "#D6D6DA")} // Green if live
                                        stroke={isLive ? "#22c55e" : "#FFFFFF"}
                                        strokeWidth={isLive ? 1 : 0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#F53", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                )
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 p-1 rounded">
                Note: Country matching requires precise ISO codes.
            </div>
        </div>
    )
}
