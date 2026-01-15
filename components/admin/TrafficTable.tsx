'use client'

import React from 'react'

interface Visit {
    id: string
    ip: string
    country: string
    userAgent: string
    timestamp: string
}

export default function TrafficTable({ visits = [] }: { visits?: Visit[] }) {
    return (
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Country</th>
                        <th className="px-4 py-3">IP Address</th>
                        <th className="px-4 py-3">Device / UA</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {visits.map((visit) => (
                        <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                                {new Date(visit.timestamp).toLocaleTimeString()}
                                <span className="text-xs text-gray-400 ml-1">
                                    {new Date(visit.timestamp).toLocaleDateString()}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {visit.country}
                                </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{visit.ip}</td>
                            <td className="px-4 py-3 truncate max-w-xs text-xs text-gray-400" title={visit.userAgent}>
                                {visit.userAgent}
                            </td>
                        </tr>
                    ))}
                    {visits.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                                No recent traffic recorded.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
