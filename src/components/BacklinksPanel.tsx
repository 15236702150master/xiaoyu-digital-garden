'use client'

import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Note } from '../types'

interface BacklinksPanelProps {
  currentNote: Note
  allNotes: Note[]
  onNoteSelect: (note: Note) => void
  isDark: boolean
}

export default function BacklinksPanel({ currentNote, allNotes, onNoteSelect, isDark }: BacklinksPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [outlinksExpanded, setOutlinksExpanded] = React.useState(true)

  // 解析HTML内容中的笔记链接（通过工具栏插入的链接有data-note-id属性）
  const parseNoteLinks = (content: string): string[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const noteLinks = doc.querySelectorAll('a.note-link[data-note-id]')
    return Array.from(noteLinks).map(link => link.getAttribute('data-note-id')).filter(Boolean) as string[]
  }

  // 获取当前笔记引用的其他笔记（出链）
  const getOutlinks = (): Note[] => {
    const linkedNoteIds = parseNoteLinks(currentNote.content)
    return allNotes.filter(note => linkedNoteIds.includes(note.id))
  }

  // 获取引用当前笔记的其他笔记（反向链接）
  const getBacklinks = (): Note[] => {
    return allNotes.filter(note => {
      if (note.id === currentNote.id) return false
      const linkedNoteIds = parseNoteLinks(note.content)
      return linkedNoteIds.includes(currentNote.id)
    })
  }

  const outlinks = getOutlinks()
  const backlinks = getBacklinks()

  // 如果没有任何链接，不显示组件
  if (outlinks.length === 0 && backlinks.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* 链接关系标题 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
          isDark ? 'text-[#e0e0e0] hover:text-[#f0f0f0]' : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        链接关系
      </button>

      {isExpanded && (
        <div className="space-y-3 ml-2">
          {/* 引用此笔记的其他笔记 */}
          {backlinks.length > 0 && (
            <div>
              <h4 className={`text-xs font-medium mb-2 ${
                isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
              }`}>
                引用此笔记的其他笔记 ({backlinks.length})
              </h4>
              <div className="space-y-1">
                {backlinks.map(note => (
                  <button
                    key={note.id}
                    onClick={() => onNoteSelect(note)}
                    className="block w-full text-left px-2 py-1.5 text-sm rounded transition-colors text-[rgb(40,75,99)] hover:text-[rgb(132,201,184)]"
                  >
                    {note.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 此笔记引用的其他笔记 */}
          {outlinks.length > 0 && (
            <div>
              <button
                onClick={() => setOutlinksExpanded(!outlinksExpanded)}
                className={`flex items-center gap-1 text-xs font-medium mb-2 transition-colors ${
                  isDark ? 'text-[#a0a0a0] hover:text-[#c0c0c0]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {outlinksExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                此笔记引用的其他笔记 ({outlinks.length})
              </button>
              
              {outlinksExpanded && (
                <div className="space-y-1 ml-4">
                  {outlinks.map(note => (
                    <button
                      key={note.id}
                      onClick={() => onNoteSelect(note)}
                      className="block w-full text-left px-2 py-1.5 text-sm rounded transition-colors text-[rgb(40,75,99)] hover:text-[rgb(132,201,184)]"
                    >
                      {note.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 暂无其他笔记引用此笔记的提示 */}
          {backlinks.length === 0 && (
            <div className={`text-xs ${
              isDark ? 'text-[#666]' : 'text-gray-400'
            }`}>
              暂无其他笔记引用此笔记
            </div>
          )}
        </div>
      )}
    </div>
  )
}
