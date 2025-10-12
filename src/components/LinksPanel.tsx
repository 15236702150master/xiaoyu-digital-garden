'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Edit, Trash2, Link as LinkIcon } from 'lucide-react'
import { Note } from '../types'

interface LinkItem {
  id: string
  text: string
  url: string
  timestamp: number
}

interface LinksPanelProps {
  currentNote: Note
  onNoteUpdate: (noteData: Partial<Note>) => void
  isDark: boolean
}

export default function LinksPanel({ 
  currentNote, 
  onNoteUpdate, 
  isDark 
}: LinksPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    linkId: string
  } | null>(null)
  const [editingLink, setEditingLink] = useState<{
    id: string
    url: string
  } | null>(null)

  // 解析笔记内容中的链接
  const parseLinks = (): LinkItem[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(currentNote.content, 'text/html')
    const linkElements = doc.querySelectorAll('a:not(.note-link)')
    
    const links: LinkItem[] = []
    let needsUpdate = false
    
    linkElements.forEach((element, index) => {
      const anchor = element as HTMLAnchorElement
      const url = anchor.href
      const text = anchor.textContent || ''
      const existingId = anchor.getAttribute('data-link-id')
      const id = existingId || `link-${index}-${Date.now()}`
      
      if (url && !url.startsWith('#')) {
        // 为链接添加唯一标识
        if (!existingId) {
          anchor.setAttribute('data-link-id', id)
          needsUpdate = true
        }
        
        links.push({
          id,
          text,
          url,
          timestamp: Date.now(),
        })
      }
    })
    
    // 如果添加了新的 ID，更新笔记内容
    if (needsUpdate) {
      const updatedContent = doc.body.innerHTML
      setTimeout(() => {
        onNoteUpdate({ content: updatedContent })
      }, 0)
    }
    
    return links
  }

  const links = parseLinks()

  // 跳转到链接位置并高亮
  const handleLinkClick = (linkId: string) => {
    const element = document.querySelector(`[data-link-id="${linkId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 高亮显示
      element.classList.add('highlight-link')
      setTimeout(() => {
        element.classList.remove('highlight-link')
      }, 2000)
    }
  }

  // 删除链接
  const handleDeleteLink = (linkId: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(currentNote.content, 'text/html')
    const element = doc.querySelector(`[data-link-id="${linkId}"]`)
    
    if (element) {
      // 保留文本内容，移除链接
      const textContent = element.textContent || ''
      element.outerHTML = textContent
      
      const updatedContent = doc.body.innerHTML
      onNoteUpdate({ content: updatedContent })
    }
    setContextMenu(null)
  }

  // 编辑链接
  const handleEditLink = (linkId: string, currentUrl: string) => {
    setEditingLink({ id: linkId, url: currentUrl })
    setContextMenu(null)
  }

  // 保存编辑的链接
  const handleSaveEdit = () => {
    if (!editingLink) return
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(currentNote.content, 'text/html')
    const element = doc.querySelector(`[data-link-id="${editingLink.id}"]`) as HTMLAnchorElement
    
    if (element) {
      element.href = editingLink.url
      
      const updatedContent = doc.body.innerHTML
      onNoteUpdate({ content: updatedContent })
    }
    setEditingLink(null)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingLink(null)
  }

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent, link: LinkItem) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      linkId: link.id
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

  if (links.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-3">
        {/* 链接面板标题 */}
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
          <LinkIcon className="w-4 h-4" />
          链接 ({links.length})
        </button>

        {isExpanded && (
          <div className="space-y-2 ml-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="group relative py-2 px-1 transition-all duration-200 cursor-pointer hover:bg-opacity-5 hover:bg-blue-500 rounded"
                onClick={() => handleLinkClick(link.id)}
                onContextMenu={(e) => handleContextMenu(e, link)}
                title={`${link.text}\n${link.url}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="link-text text-sm font-medium mb-1 transition-all duration-200 text-[rgb(40,75,99)]">
                      {truncateText(link.text)}
                    </div>
                    <div className={`text-xs truncate ${
                      isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
                    }`}>
                      {truncateText(link.url, 20)}
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
                const link = links.find(l => l.id === contextMenu.linkId)
                if (link) {
                  handleEditLink(link.id, link.url)
                }
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-[#e0e0e0] hover:bg-[#3a3a3a]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Edit className="w-4 h-4" />
              编辑链接
            </button>
            <button
              onClick={() => handleDeleteLink(contextMenu.linkId)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-red-400 hover:bg-[#3a3a3a]'
                  : 'text-red-600 hover:bg-gray-100'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              删除链接
            </button>
          </div>
        </div>
      )}

      {/* 编辑链接对话框 */}
      {editingLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
            isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
            }`}>
              编辑链接
            </h3>
            <input
              type="url"
              value={editingLink.url}
              onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
              placeholder="请输入链接地址..."
              className={`w-full p-3 border rounded-lg ${
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
        .highlight-link {
          background: ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'} !important;
          transition: background 0.3s ease;
        }
        
        .group:hover .link-text {
          color: rgb(132,201,184);
        }
      `}</style>
    </>
  )
}
