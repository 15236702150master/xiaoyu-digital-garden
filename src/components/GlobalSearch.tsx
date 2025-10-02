'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, FileText } from 'lucide-react'
import { Note } from '@/types'
import { checkFirstSearch } from '@/utils/easterEggTriggers'

interface GlobalSearchProps {
  notes: Note[]
  isDark: boolean
  onNoteSelect: (note: Note) => void
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ notes, isDark, onNoteSelect, isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Note[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // 搜索逻辑
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(0)
      return
    }
    
    // 触发第一次搜索彩蛋
    checkFirstSearch()

    const searchResults = notes.filter(note => {
      const searchTerm = query.toLowerCase()
      return (
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        note.category.toLowerCase().includes(searchTerm)
      )
    }).slice(0, 10) // 限制显示10个结果

    setResults(searchResults)
    setSelectedIndex(0)
  }, [query, notes])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            onNoteSelect(results[selectedIndex])
            onClose()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onNoteSelect, onClose])

  // 自动聚焦
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // 高亮匹配文本
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 搜索框 */}
      <div className={`relative w-full max-w-2xl mx-4 rounded-lg shadow-2xl ${
        isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
      }`}>
        {/* 搜索输入 */}
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-[#404040]">
          <Search className={`w-5 h-5 mr-3 ${isDark ? 'text-[#a0a0a0]' : 'text-gray-400'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索笔记标题、内容、标签..."
            className={`flex-1 text-lg bg-transparent outline-none ${
              isDark ? 'text-[#e0e0e0] placeholder-[#a0a0a0]' : 'text-gray-900 placeholder-gray-500'
            }`}
          />
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-[#404040] ${
              isDark ? 'text-[#a0a0a0]' : 'text-gray-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索结果 */}
        <div className="max-h-96 overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className={`p-8 text-center ${
              isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
            }`}>
              未找到匹配的笔记
            </div>
          )}

          {results.map((note, index) => (
            <div
              key={note.id}
              onClick={() => {
                onNoteSelect(note)
                onClose()
              }}
              className={`p-4 cursor-pointer border-b border-gray-100 dark:border-[#404040] last:border-b-0 ${
                index === selectedIndex
                  ? (isDark ? 'bg-[#404040]' : 'bg-blue-50')
                  : (isDark ? 'hover:bg-[#353535]' : 'hover:bg-gray-50')
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText className={`w-4 h-4 mt-1 flex-shrink-0 ${
                  isDark ? 'text-[#a0a0a0]' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium mb-1 ${
                    isDark ? 'text-[#e0e0e0]' : 'text-gray-900'
                  }`}>
                    {highlightText(note.title, query)}
                  </h3>
                  <p className={`text-sm line-clamp-2 ${
                    isDark ? 'text-[#a0a0a0]' : 'text-gray-600'
                  }`}>
                    {highlightText(note.content.slice(0, 150) + (note.content.length > 150 ? '...' : ''), query)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      isDark ? 'bg-[#404040] text-[#a0a0a0]' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {note.category}
                    </span>
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className={`text-xs px-2 py-1 rounded ${
                        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 快捷键提示 */}
        {results.length > 0 && (
          <div className={`px-4 py-2 text-xs border-t ${
            isDark 
              ? 'text-[#a0a0a0] border-[#404040] bg-[#1a1a1a]' 
              : 'text-gray-500 border-gray-200 bg-gray-50'
          }`}>
            <span>↑↓ 导航</span>
            <span className="mx-2">•</span>
            <span>Enter 选择</span>
            <span className="mx-2">•</span>
            <span>Esc 关闭</span>
          </div>
        )}
      </div>
    </div>
  )
}
