'use client'

import React, { useState, useEffect } from 'react'
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useConfig, AppConfig, IntroStep } from '@/components/ConfigContext'
import { Trash2, Plus, Save, Clock, Type, Settings, LayoutGrid, List, Palette } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

// -- LOGIN COMPONENT --
function AdminLogin({ onLogin }: { onLogin: () => void }) {
    const [answer, setAnswer] = useState("")
    const [error, setError] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (answer === "26102006") {
            onLogin()
        } else {
            setError(true)
            setAnswer("")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#e0ded5]">
            {/* Background Mesh */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-200/30 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-white/80 p-12 rounded-[2rem] shadow-2xl text-center z-10 animate-zoom-in">
                <h1 className="text-gray-900 text-3xl font-serif italic mb-2">
                    The Gatekeeper
                </h1>
                <p className="text-gray-500 text-xs tracking-widest uppercase mb-10 font-bold">
                    Restricted Access
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group text-left">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={answer}
                            onChange={(e) => {
                                setAnswer(e.target.value)
                                setError(false)
                            }}
                            className="w-full bg-white/70 border border-gray-200 p-4 text-center text-xl tracking-widest focus:outline-none focus:border-gray-400 focus:bg-white transition-all rounded-xl shadow-inner text-gray-900 placeholder:text-gray-300"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && (
                        <p className="text-red-500 text-xs font-bold animate-pulse">
                            Access Denied.
                        </p>
                    )}
                    <button
                        type="submit"
                        className="w-full py-4 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black hover:scale-[1.02] active:scale-95 transition-all duration-300 font-bold tracking-wide"
                    >
                        Enter
                    </button>
                </form>
            </div>
        </div>
    )
}

// -- MAIN DASHBOARD --
export default function AdminPage() {
    const [isAuth, setIsAuth] = useState(false)
    const [activeTab, setActiveTab] = useState<'WISHES' | 'CONFIG'>('WISHES')

    // Config Data
    const { config, updateConfig } = useConfig()
    const [localConfig, setLocalConfig] = useState<AppConfig | null>(null)
    const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED" | "ERROR">("IDLE")

    // Wishes Data
    const [wishes, setWishes] = useState<{ id: string, message: string, timestamp: number }[]>([])

    // Bulk Import Modal
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
    const [bulkInput, setBulkInput] = useState("")
    const [isImporting, setIsImporting] = useState(false)
    const [bulkColor, setBulkColor] = useState("#e0e0e0") // Default color

    // Load Config
    useEffect(() => {
        if (config) {
            setLocalConfig(JSON.parse(JSON.stringify(config)))
        }
    }, [config])

    // Load Wishes
    useEffect(() => {
        if (!isAuth) return
        const unsub = onSnapshot(collection(db, 'wishes'), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
                .sort((a: any, b: any) => b.timestamp - a.timestamp)
            setWishes(list)
        })
        return () => unsub()
    }, [isAuth])

    // Handlers
    const handleDeleteWish = async (id: string) => {
        try {
            const res = await fetch('/api/admin/delete-wish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': '26102006'
                },
                body: JSON.stringify({ id })
            })
            if (!res.ok) throw new Error("API Error")
            // Optimistic update not needed as onSnapshot will trigger
        } catch (e) {
            console.error(e)
            alert("Failed to delete wish. Check permissions.")
        }
    }

    const handleBulkImport = async () => {
        const lines = bulkInput.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        if (lines.length === 0) return

        setIsImporting(true)
        try {
            const res = await fetch('/api/admin/import-wishes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': '26102006'
                },
                body: JSON.stringify({ wishes: lines, color: bulkColor })
            })
            if (!res.ok) throw new Error("Import Failed")

            const data = await res.json()
            setBulkInput("")
            setIsBulkImportOpen(false)
            alert(`Successfully imported ${data.count} wishes!`)
        } catch (e) {
            console.error(e)
            alert("Error importing wishes.")
        } finally {
            setIsImporting(false)
        }
    }

    const handleSaveConfig = async () => {
        if (!localConfig) return
        setSaveStatus("SAVING")
        try {
            await updateConfig(localConfig)
            setSaveStatus("SAVED")
            setTimeout(() => setSaveStatus("IDLE"), 2000)
        } catch (e) {
            console.error(e)
            setSaveStatus("ERROR")
        }
    }

    const handleIntroChange = (index: number, field: keyof IntroStep, value: any) => {
        if (!localConfig) return
        const newSeq = [...localConfig.introSequence]
        newSeq[index] = { ...newSeq[index], [field]: value }
        setLocalConfig({ ...localConfig, introSequence: newSeq })
    }

    const addIntroStep = () => {
        if (!localConfig) return
        setLocalConfig({
            ...localConfig,
            introSequence: [...localConfig.introSequence, { text: "New line...", duration: 2, hold: 1.5 }]
        })
    }

    const removeIntroStep = (index: number) => {
        if (!localConfig) return
        const newSeq = localConfig.introSequence.filter((_, i) => i !== index)
        setLocalConfig({ ...localConfig, introSequence: newSeq })
    }

    if (!isAuth) return <AdminLogin onLogin={() => setIsAuth(true)} />

    return (
        <div className="h-screen w-full bg-[#e0ded5] text-gray-900 font-sans selection:bg-gray-900/10 overflow-y-auto">
            {/* Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-amber-100/40 rounded-full blur-[100px]" />
            </div>

            {/* Header / Nav */}
            <nav className="sticky top-4 z-50 mx-auto max-w-2xl bg-white/80 backdrop-blur-md border border-white/50 shadow-sm px-2 py-2 rounded-full flex justify-between items-center transition-all animate-slide-up">
                <div className="flex items-center gap-3 pl-4">
                    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-serif italic text-sm shadow-md">
                        A
                    </div>
                    <span className="font-serif italic text-lg text-gray-800 hidden sm:block">Admin</span>
                </div>

                <div className="flex bg-gray-100/50 p-1 rounded-full border border-gray-200/50">
                    <button
                        onClick={() => setActiveTab('WISHES')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300",
                            activeTab === 'WISHES' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <LayoutGrid size={16} /> Wishes
                    </button>
                    <button
                        onClick={() => setActiveTab('CONFIG')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300",
                            activeTab === 'CONFIG' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <Settings size={16} /> Content
                    </button>
                </div>
            </nav>

            <main className="relative z-10 max-w-6xl mx-auto p-6 md:p-12 pb-32">

                {/* WISHES TAB */}
                {activeTab === 'WISHES' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-end mb-8 px-2">
                            <div>
                                <h2 className="text-4xl font-serif italic text-gray-900 mb-2">Paper Wishes</h2>
                                <p className="text-gray-500 font-medium">Managing {wishes.length} wishes released to the fold.</p>
                            </div>
                            <button
                                onClick={() => setIsBulkImportOpen(true)}
                                className="bg-gray-900 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-black transition-colors shadow-lg shadow-gray-900/20"
                            >
                                <Plus size={16} /> Add Wishes
                            </button>
                        </div>

                        {/* Bulk Import Modal - Basic implementation for speed */}
                        {isBulkImportOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsBulkImportOpen(false)}>
                                <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-2xl font-serif italic">Bulk Import Wishes</h3>
                                        <button onClick={() => setIsBulkImportOpen(false)} className="text-gray-400 hover:text-gray-900 font-bold text-xl">×</button>
                                    </div>
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">One wish per line</p>
                                    <textarea
                                        value={bulkInput}
                                        onChange={e => setBulkInput(e.target.value)}
                                        className="w-full h-64 bg-gray-50 rounded-xl border border-gray-200 p-4 focus:ring-2 ring-gray-900 focus:outline-none resize-none font-medium text-gray-800 placeholder:text-gray-300"
                                        placeholder="I wish for happiness...&#10;I wish to see the world...&#10;I wish for peace..."
                                    />

                                    {/* BULK COLOR SELECTION */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Color for Batch</p>
                                        <div className="flex flex-wrap gap-2">
                                            {localConfig?.craneColors?.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setBulkColor(c.color)}
                                                    className={`w-10 h-10 rounded-full border-2 transition-all ${bulkColor === c.color
                                                        ? 'border-gray-900 scale-110 shadow-md'
                                                        : 'border-transparent hover:scale-105'
                                                        }`}
                                                    style={{ backgroundColor: c.color }}
                                                    title={c.label}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button onClick={() => setIsBulkImportOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                                        <button
                                            onClick={handleBulkImport}
                                            disabled={isImporting}
                                            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg disabled:opacity-50"
                                        >
                                            {isImporting ? 'Importing...' : 'Import Wishes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {wishes.map(wish => (
                                <div key={wish.id} className="group relative bg-white/70 backdrop-blur-sm p-8 rounded-[1.5rem] shadow-sm border border-white/60 hover:border-gray-300 hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                    <div className="mb-10 min-h-[80px]">
                                        <p className="font-serif text-xl leading-relaxed text-gray-800">"{wish.message}"</p>
                                    </div>
                                    <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center border-t border-gray-200 pt-4 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] tracking-wider uppercase text-gray-400 font-bold">
                                            {new Date(wish.timestamp).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteWish(wish.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-2 -mr-2 rounded-full hover:bg-red-50"
                                            title="Delete Wish"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CONFIG CONFIG TAB */}
                {activeTab === 'CONFIG' && localConfig && (
                    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">

                        {/* INTRO SEQUENCE */}
                        <section className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-white/50">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-gray-900 rounded-xl text-white shadow-lg">
                                    <List size={20} />
                                </div>
                                <h2 className="text-3xl font-serif italic text-gray-900">Intro Sequence</h2>
                            </div>

                            <div className="space-y-8 pl-6 border-l-[3px] border-gray-200 relative">
                                {localConfig.introSequence.map((step, i) => (
                                    <div key={i} className="relative group bg-white/80 p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-300">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[35px] top-10 w-5 h-5 rounded-full bg-white border-[4px] border-gray-900 z-10 shadow-sm"></div>

                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">
                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Text Content</label>
                                                <textarea
                                                    value={step.text}
                                                    onChange={(e) => handleIntroChange(i, 'text', e.target.value)}
                                                    className="w-full text-xl font-medium bg-transparent border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:ring-0 p-0 py-2 resize-none transition-colors text-gray-900 placeholder:text-gray-300"
                                                    rows={1}
                                                    placeholder="Enter text..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 w-full md:w-auto bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div className="space-y-1 text-center">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                                                        Fade
                                                    </label>
                                                    <input
                                                        type="number" step="0.1"
                                                        value={step.duration}
                                                        onChange={(e) => handleIntroChange(i, 'duration', parseFloat(e.target.value))}
                                                        className="w-16 bg-white rounded-lg px-2 py-1 text-center font-bold text-gray-900 border border-gray-200 focus:border-gray-900 outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1 text-center">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                                                        Hold
                                                    </label>
                                                    <input
                                                        type="number" step="0.1"
                                                        value={step.hold}
                                                        onChange={(e) => handleIntroChange(i, 'hold', parseFloat(e.target.value))}
                                                        className="w-16 bg-white rounded-lg px-2 py-1 text-center font-bold text-gray-900 border border-gray-200 focus:border-gray-900 outline-none"
                                                    />
                                                </div>

                                            </div>

                                            {/* Style Toggle */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => handleIntroChange(i, 'highlight', !step.highlight)}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${step.highlight
                                                        ? 'bg-gray-900 text-white border-gray-900'
                                                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}
                                                >
                                                    {step.highlight ? '★ Hero Style' : 'Normal Style'}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeIntroStep(i)}
                                            className="absolute -top-3 -right-3 bg-white text-gray-400 hover:text-red-500 shadow-md border border-gray-100 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100"
                                            title="Remove Step"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addIntroStep}
                                className="ml-6 mt-8 flex items-center gap-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm"
                            >
                                <Plus size={16} /> Add Step
                            </button>
                        </section>

                        {/* OTHER SETTINGS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Instructions */}
                            <section className="bg-white/60 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-lg border border-white/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gray-200 rounded-lg text-gray-700"><Type size={18} /></div>
                                    <h2 className="text-xl font-serif italic text-gray-900">Instructions</h2>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3">
                                        Void Mode Label
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig.instructions.void}
                                        onChange={(e) => setLocalConfig({ ...localConfig, instructions: { ...localConfig.instructions, void: e.target.value } })}
                                        className="w-full text-base p-4 bg-white rounded-xl border border-gray-200 focus:border-gray-900 outline-none transition-all shadow-sm font-medium text-gray-800"
                                    />
                                </div>
                                <div className="mt-6">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3">
                                        Wish Input Placeholder
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig.instructions.wishPlaceholder}
                                        onChange={(e) => setLocalConfig({ ...localConfig, instructions: { ...localConfig.instructions, wishPlaceholder: e.target.value } })}
                                        className="w-full text-base p-4 bg-white rounded-xl border border-gray-200 focus:border-gray-900 outline-none transition-all shadow-sm font-medium text-gray-800"
                                    />
                                </div>
                            </section>

                            {/* Timings */}
                            <section className="bg-white/60 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-lg border border-white/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gray-200 rounded-lg text-gray-700"><Clock size={18} /></div>
                                    <h2 className="text-xl font-serif italic text-gray-900">Global Timings</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Release Delay</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={localConfig.appTimings.releaseDelay}
                                                onChange={(e) => setLocalConfig({ ...localConfig, appTimings: { ...localConfig.appTimings, releaseDelay: parseInt(e.target.value) } })}
                                                className="w-20 bg-gray-50 rounded-lg px-2 py-1 text-right font-mono font-bold text-gray-900 outline-none focus:bg-white focus:ring-1 ring-gray-200"
                                            />
                                            <span className="text-xs text-gray-400">ms</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Settling Time</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={localConfig.appTimings.settleTime}
                                                onChange={(e) => setLocalConfig({ ...localConfig, appTimings: { ...localConfig.appTimings, settleTime: parseInt(e.target.value) } })}
                                                className="w-20 bg-gray-50 rounded-lg px-2 py-1 text-right font-mono font-bold text-gray-900 outline-none focus:bg-white focus:ring-1 ring-gray-200"
                                            />
                                            <span className="text-xs text-gray-400">ms</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Settling Time</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={localConfig.appTimings.settleTime}
                                                onChange={(e) => setLocalConfig({ ...localConfig, appTimings: { ...localConfig.appTimings, settleTime: parseInt(e.target.value) } })}
                                                className="w-20 bg-gray-50 rounded-lg px-2 py-1 text-right font-mono font-bold text-gray-900 outline-none focus:bg-white focus:ring-1 ring-gray-200"
                                            />
                                            <span className="text-xs text-gray-400">ms</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* EMOTIONAL PALETTE EDITOR */}
                            <section className="col-span-1 md:col-span-2 bg-white/60 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-lg border border-white/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gray-200 rounded-lg text-gray-700"><Palette size={18} /></div>
                                    <h2 className="text-xl font-serif italic text-gray-900">Emotional Palette</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {localConfig.craneColors?.map((colorItem, index) => (
                                        <div key={colorItem.id} className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full border border-gray-200 shadow-sm"
                                                    style={{ backgroundColor: colorItem.color }}
                                                />
                                                <input
                                                    type="color"
                                                    value={colorItem.color}
                                                    onChange={(e) => {
                                                        const newColors = [...(localConfig.craneColors || [])]
                                                        newColors[index] = { ...newColors[index], color: e.target.value }
                                                        setLocalConfig({ ...localConfig, craneColors: newColors })
                                                    }}
                                                    className="w-8 h-8 cursor-pointer opacity-0 absolute"
                                                    style={{ width: '40px', height: '40px' }} // Overlay on preview
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400">Color Hex</span>
                                                    <input
                                                        type="text"
                                                        value={colorItem.color}
                                                        onChange={(e) => {
                                                            const newColors = [...(localConfig.craneColors || [])]
                                                            newColors[index] = { ...newColors[index], color: e.target.value }
                                                            setLocalConfig({ ...localConfig, craneColors: newColors })
                                                        }}
                                                        className="font-mono text-xs font-bold text-gray-800 outline-none w-20"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-400">Meaning</label>
                                                <input
                                                    type="text"
                                                    value={colorItem.label}
                                                    onChange={(e) => {
                                                        const newColors = [...(localConfig.craneColors || [])]
                                                        newColors[index] = { ...newColors[index], label: e.target.value }
                                                        setLocalConfig({ ...localConfig, craneColors: newColors })
                                                    }}
                                                    className="w-full text-sm font-medium text-gray-900 border-b border-gray-200 focus:border-gray-900 outline-none py-1 transition-colors"
                                                    placeholder="Label (e.g. Unsent)"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-400">Placeholder Hint</label>
                                                <input
                                                    type="text"
                                                    value={colorItem.placeholder || ''}
                                                    onChange={(e) => {
                                                        const newColors = [...(localConfig.craneColors || [])]
                                                        newColors[index] = { ...newColors[index], placeholder: e.target.value }
                                                        setLocalConfig({ ...localConfig, craneColors: newColors })
                                                    }}
                                                    className="w-full text-sm font-medium text-gray-500 border-b border-gray-200 focus:border-gray-900 outline-none py-1 transition-colors italic"
                                                    placeholder="Custom placeholder..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>


                    </div>
                )}
            </main>

            {/* FLOATING SAVE BUTTON */}
            {activeTab === 'CONFIG' && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
                    <button
                        onClick={handleSaveConfig}
                        disabled={saveStatus === 'SAVING' || saveStatus === 'SAVED'}
                        className={cn(
                            "pointer-events-auto w-full flex items-center justify-center gap-3 py-4 rounded-2xl shadow-2xl font-bold tracking-widest uppercase transition-all duration-300 transform hover:-translate-y-1 active:scale-95 border border-white/20 backdrop-blur-lg",
                            saveStatus === 'SAVED' ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-gray-900 text-white shadow-gray-900/30 hover:bg-black",
                            saveStatus === 'ERROR' ? "bg-red-500 shadow-red-500/30" : ""
                        )}
                    >
                        {saveStatus === 'SAVING' && <span className="animate-spin text-lg">⟳</span>}
                        {saveStatus === 'SAVED' ? 'Changes Live!' : 'Publish Changes'}
                    </button>
                </div>
            )}
        </div>
    )
}
