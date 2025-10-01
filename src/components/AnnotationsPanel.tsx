'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Edit, Trash2, MessageSquare } from 'lucide-react'
import { Note } from '../types'

interface Annotation {
  id: string
  text: string
  timestamp: number
  position?: number
}

interface AnnotationsPanelProps {
  currentNote: Note
  onNoteUpdate: (noteData: Partial<Note>) => void
  onScrollToAnnotation?: (position: number) => void
  isDark: boolean
}

export default function AnnotationsPanel({ 
  currentNote, 
  onNoteUpdate, 
  onScrollToAnnotation, 
  isDark 
}: AnnotationsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    annotationId: string
  } | null>(null)
  const [editingAnnotation, setEditingAnnotation] = useState<{
    id: string
    text: string
  } | null>(null)

  // 解析笔记内容中的备注
  const parseAnnotations = (): Annotation[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(currentNote.content, 'text/html')
    const annotationElements = doc.querySelectorAll('.text-with-note[data-note-id][data-note-text]')
    
    const annotations: Annotation[] = []
    annotationElements.forEach(element => {
      const id = element.getAttribute('data-note-id')
      const text = element.getAttribute('data-note-text')
      const timestamp = id ? parseInt(id.replace('note-', '')) : Date.now()
      
      if (id && text) {
        annotations.push({
          id,
          text: text.replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
          timestamp,
        })
      }
    })
    
    // 按时间排序（最新的在前）
    return annotations.sort((a, b) => b.timestamp - a.timestamp)
  }

  const annotations = parseAnnotations()

  // 跳转到备注位置
  const handleAnnotationClick = (annotationId: string) => {
    // 查找对应的备注元素并滚动到该位置
    const element = document.querySelector(`[data-note-id="${annotationId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 高亮显示
      element.classList.add('highlight-annotation')
      setTimeout(() => {
        element.classList.remove('highlight-annotation')
      }, 2000)
    }
  }

  // 删除备注
  const handleDeleteAnnotation = (annotationId: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(currentNote.content, 'text/html')
    const element = doc.querySelector(`[data-note-id="${annotationId}"]`)
    
    if (element) {
      // 保留文本内容，移除备注标记
      const textContent = element.textContent || ''
      element.outerHTML = textContent
      
      const updatedContent = doc.body.innerHTML
      onNoteUpdate({ content: updatedContent })
    }
    setContextMenu(null)
  }

  // 编辑备注
  const handleEditAnnotation = (annotationId: string, currentText: string) => {
    setEditingAnnotation({ id: annotationId, text: currentText })
    setContextMenu(null)
  }

  // 保存编辑的备注
  const handleSaveEdit = () => {
    if (!editingAnnotation) return
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(currentNote.content, 'text/html')
    const element = doc.querySelector(`[data-note-id="${editingAnnotation.id}"]`)
    
    if (element) {
      const escapedText = editingAnnotation.text.replace(/"/g, '&quot;').replace(/&/g, '&amp;')
      element.setAttribute('data-note-text', escapedText)
      
      const updatedContent = doc.body.innerHTML
      onNoteUpdate({ content: updatedContent })
    }
    setEditingAnnotation(null)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingAnnotation(null)
  }

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent, annotation: Annotation) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      annotationId: annotation.id
    })
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null)
    }
    
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  // 截断文本显示
  const truncateText = (text: string, maxLength: number = 10) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    })
  }

  if (annotations.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-3">
        {/* 备注面板标题 */}
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
          <MessageSquare className="w-4 h-4" />
          备注 ({annotations.length})
        </button>

        {isExpanded && (
          <div className="space-y-2 ml-2">
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className="group relative py-2 px-1 transition-all duration-200 cursor-pointer hover:bg-opacity-5 hover:bg-blue-500 rounded"
                onClick={() => handleAnnotationClick(annotation.id)}
                onContextMenu={(e) => handleContextMenu(e, annotation)}
                title={annotation.text} // 悬浮显示完整内容
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="annotation-text text-sm font-medium mb-1 transition-all duration-200 text-[rgb(40,75,99)]">
                      {truncateText(annotation.text)}
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
                    }`}>
                      {formatTime(annotation.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className={`fixed z-50 min-w-32 rounded-lg shadow-lg border ${
            isDark 
              ? 'bg-[#2a2a2a] border-[#404040]' 
              : 'bg-white border-gray-200'
          }`}
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                const annotation = annotations.find(a => a.id === contextMenu.annotationId)
                if (annotation) {
                  handleEditAnnotation(annotation.id, annotation.text)
                }
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-[#e0e0e0] hover:bg-[#3a3a3a]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Edit className="w-4 h-4" />
              编辑备注
            </button>
            <button
              onClick={() => handleDeleteAnnotation(contextMenu.annotationId)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-red-400 hover:bg-[#3a3a3a]'
                  : 'text-red-600 hover:bg-gray-100'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              删除备注
            </button>
          </div>
        </div>
      )}

      {/* 编辑备注对话框 */}
      {editingAnnotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
            isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
            }`}>
              编辑备注
            </h3>
            <textarea
              value={editingAnnotation.text}
              onChange={(e) => setEditingAnnotation({ ...editingAnnotation, text: e.target.value })}
              placeholder="请输入备注内容..."
              className={`w-full h-24 p-3 border rounded-lg resize-none ${
                isDark 
                  ? 'bg-[#1a1a1a] border-[#404040] text-[#e0e0e0] placeholder-[#a0a0a0]' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleCancelEdit}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-[#404040] text-[#e0e0e0] hover:bg-[#4a4a4a]'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加高亮样式和悬浮渐变效果 */}
      <style jsx>{`
        .highlight-annotation {
          background: ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'} !important;
          transition: background 0.3s ease;
        }
        
        .group:hover .annotation-text {
          color: rgb(132,201,184);
        }
      `}</style>
    </>
  )
}
