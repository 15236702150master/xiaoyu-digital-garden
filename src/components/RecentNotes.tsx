'use client'

import { Note } from '@/types'
import { Calendar, FileText } from 'lucide-react'

interface RecentNotesProps {
  notes: Note[]
  isDark: boolean
  onNoteSelect: (note: Note) => void
  selectedNote?: Note
}

export default function RecentNotes({ notes, isDark, onNoteSelect, selectedNote }: RecentNotesProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'numeric',
      day: 'numeric'
    }).format(date)
  }

  const recentNotes = notes
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  return (
    <div>
      <h3 className={`
        text-sm font-semibold mb-3
        ${isDark ? 'text-[#e0e0e0]' : 'text-[#2d3748]'}
      `}>
        最近的笔记
      </h3>
      
      <div className="space-y-1">
        {recentNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => onNoteSelect(note)}
            className={`
              flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors text-sm
              ${selectedNote?.id === note.id
                ? (isDark ? 'text-blue-400' : 'text-blue-600')
                : (isDark 
                    ? 'text-[rgb(40,75,99)] hover:text-[rgb(132,201,184)]' 
                    : 'text-[rgb(40,75,99)] hover:text-[rgb(132,201,184)]')
              }
            `}
          >
            <FileText className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{note.title}</span>
          </div>
        ))}
        
        {recentNotes.length === 0 && (
          <div className={`
            text-center py-8 text-sm
            ${isDark ? 'text-[#a0a0a0]' : 'text-gray-500'}
          `}>
            还没有笔记
          </div>
        )}
      </div>
    </div>
  )
}
