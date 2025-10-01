'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, FileText, Calendar, Users, BookOpen, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import { NoteTemplate, Category } from '../types'
import { TemplateStorage } from '../lib/templateStorage'

interface TemplateManagerProps {
  isOpen: boolean
  onClose: () => void
  onCreateNoteFromTemplate: (template: NoteTemplate, title: string, categoryName: string) => void
  onCreateTemplate: (templateName: string) => void
  onEditTemplate: (template: NoteTemplate) => void
  categories: Category[]
  isDark: boolean
}

export default function TemplateManager({ 
  isOpen, 
  onClose, 
  onCreateNoteFromTemplate,
  onCreateTemplate,
  onEditTemplate,
  categories, 
  isDark 
}: TemplateManagerProps) {
  const [customTemplates, setCustomTemplates] = useState<NoteTemplate[]>([])
  const [systemTemplates, setSystemTemplates] = useState<NoteTemplate[]>([])
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    template: NoteTemplate
  } | null>(null)
  const [showCategorySelector, setShowCategorySelector] = useState<{
    template: NoteTemplate
    x: number
    y: number
  } | null>(null)
  const [showTitleInput, setShowTitleInput] = useState<{
    template: NoteTemplate
    categoryName: string
  } | null>(null)
  const [showTemplateNameInput, setShowTemplateNameInput] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      setCustomTemplates(TemplateStorage.getTemplates())
      setSystemTemplates(TemplateStorage.getSystemTemplates())
    }
  }, [isOpen])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // 检查是否点击在分类选择器内部
      if (showCategorySelector) {
        const categorySelector = document.querySelector('.category-selector-modal')
        if (categorySelector && categorySelector.contains(target)) {
          return
        }
      }
      
      // 检查是否点击在右键菜单内部
      if (contextMenu) {
        const contextMenuElement = document.querySelector('.context-menu')
        if (contextMenuElement && contextMenuElement.contains(target)) {
          return
        }
      }
      
      setContextMenu(null)
      setShowCategorySelector(null)
      // 注意：不自动关闭模板名称输入框，让用户手动取消
    }
    
    if (contextMenu || showCategorySelector) {
      document.addEventListener('click', handleClickOutside, true) // 使用捕获阶段
      return () => document.removeEventListener('click', handleClickOutside, true)
    }
  }, [contextMenu, showCategorySelector])

  if (!isOpen) return null

  // 处理模板右键菜单
  const handleTemplateContextMenu = (e: React.MouseEvent, template: NoteTemplate) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      template
    })
  }

  // 处理新建笔记 - 显示分类选择器
  const handleCreateNote = (template: NoteTemplate) => {
    setShowCategorySelector({
      template,
      x: Math.min(contextMenu?.x || window.innerWidth / 2, window.innerWidth - 300),
      y: Math.min(contextMenu?.y || window.innerHeight / 2, window.innerHeight - 200)
    })
    setContextMenu(null)
  }

  // 选择分类后输入标题
  const handleCategorySelect = (template: NoteTemplate, categoryName: string) => {
    setShowTitleInput({ template, categoryName })
    setShowCategorySelector(null)
  }

  // 确认创建笔记
  const handleConfirmCreateNote = () => {
    if (showTitleInput && newNoteTitle.trim()) {
      onCreateNoteFromTemplate(showTitleInput.template, newNoteTitle.trim(), showTitleInput.categoryName)
      setShowTitleInput(null)
      setNewNoteTitle('')
      onClose()
    }
  }

  // 删除模板
  const handleDeleteTemplate = (template: NoteTemplate) => {
    if (template.isSystem) return // 系统模板不能删除
    
    if (confirm(`确定要删除模板"${template.name}"吗？`)) {
      TemplateStorage.deleteTemplate(template.id)
      setCustomTemplates(TemplateStorage.getTemplates())
    }
    setContextMenu(null)
  }

  // 编辑模板
  const handleEditTemplate = (template: NoteTemplate) => {
    onEditTemplate(template)
    setContextMenu(null)
    onClose()
  }

  // 创建新模板
  const handleCreateNewTemplate = () => {
    setShowTemplateNameInput(true)
  }

  // 确认创建模板
  const handleConfirmCreateTemplate = () => {
    if (newTemplateName.trim()) {
      onCreateTemplate(newTemplateName.trim())
      setShowTemplateNameInput(false)
      setNewTemplateName('')
      onClose()
    }
  }

  // 构建分类树
  const buildCategoryTree = (): Category[] => {
    const rootCategories = categories.filter(cat => !cat.parentId)
    
    const addChildren = (category: Category): Category => {
      const children = categories.filter(cat => cat.parentId === category.id)
      return {
        ...category,
        children: children.map(addChildren)
      }
    }
    
    return rootCategories.map(addChildren)
  }

  // 渲染分类选择器
  const renderCategorySelector = (categories: Category[], level: number = 0) => {
    return categories.map(category => {
      const hasChildren = category.children && category.children.length > 0
      const isExpanded = expandedCategories.has(category.id)
      
      return (
        <div key={category.id}>
          <div
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 ${
              isDark ? 'hover:bg-[#3a3a3a]' : 'hover:bg-gray-100'
            }`}
            onClick={() => showCategorySelector && handleCategorySelect(showCategorySelector.template, category.name)}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  e.nativeEvent.stopImmediatePropagation()
                  const newExpanded = new Set(expandedCategories)
                  if (isExpanded) {
                    newExpanded.delete(category.id)
                  } else {
                    newExpanded.add(category.id)
                  }
                  setExpandedCategories(newExpanded)
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                className="p-0.5 category-expand-btn"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}
            <span className={`text-sm ${isDark ? 'text-[#e0e0e0]' : 'text-gray-700'}`}>
              {category.name}
            </span>
          </div>
          
          {hasChildren && isExpanded && category.children && (
            <div>
              {renderCategorySelector(category.children, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden ${
          isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
        }`}>
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-[#404040]' : 'border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
            }`}>
              模板管理
            </h2>
            <button 
              onClick={onClose} 
              className={`p-1 rounded transition-colors ${
                isDark ? 'hover:bg-[#3a3a3a] text-[#e0e0e0]' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 我的模板 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-medium ${
                    isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
                  }`}>
                    我的模板
                  </h3>
                  <button
                    onClick={handleCreateNewTemplate}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    新建模板
                  </button>
                </div>
                
                <div className="space-y-3">
                  {customTemplates.length === 0 ? (
                    <div className={`text-center py-8 ${
                      isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
                    }`}>
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>还没有自定义模板</p>
                      <p className="text-sm">点击"新建模板"开始创建</p>
                    </div>
                  ) : (
                    customTemplates.map(template => (
                      <div
                        key={template.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          isDark
                            ? 'border-[#404040] bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                        onContextMenu={(e) => handleTemplateContextMenu(e, template)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium mb-1 ${
                              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
                            }`}>
                              {template.name}
                            </h4>
                            {template.description && (
                              <p className={`text-sm mb-2 ${
                                isDark ? 'text-[#a0a0a0]' : 'text-gray-600'
                              }`}>
                                {template.description}
                              </p>
                            )}
                            <p className={`text-xs ${
                              isDark ? 'text-[#666]' : 'text-gray-400'
                            }`}>
                              创建于 {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                          <FileText className={`w-5 h-5 ${
                            isDark ? 'text-[#a0a0a0]' : 'text-gray-400'
                          }`} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 系统预设模板 */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${
                  isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
                }`}>
                  系统预设模板
                </h3>
                
                <div className="space-y-3">
                  {systemTemplates.map(template => {
                    const getIcon = () => {
                      switch (template.id) {
                        case 'system-diary': return <Calendar className="w-5 h-5" />
                        case 'system-meeting': return <Users className="w-5 h-5" />
                        case 'system-project': return <FileText className="w-5 h-5" />
                        case 'system-study': return <BookOpen className="w-5 h-5" />
                        default: return <FileText className="w-5 h-5" />
                      }
                    }

                    return (
                      <div
                        key={template.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          isDark
                            ? 'border-[#404040] bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                        onContextMenu={(e) => handleTemplateContextMenu(e, template)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium mb-1 ${
                              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
                            }`}>
                              {template.name}
                            </h4>
                            {template.description && (
                              <p className={`text-sm mb-2 ${
                                isDark ? 'text-[#a0a0a0]' : 'text-gray-600'
                              }`}>
                                {template.description}
                              </p>
                            )}
                            <p className={`text-xs ${
                              isDark ? 'text-[#666]' : 'text-gray-400'
                            }`}>
                              系统预设
                            </p>
                          </div>
                          <div className={isDark ? 'text-[#a0a0a0]' : 'text-gray-400'}>
                            {getIcon()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className={`context-menu fixed z-50 min-w-32 rounded-lg shadow-lg border ${
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
              onClick={() => handleCreateNote(contextMenu.template)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-[#e0e0e0] hover:bg-[#3a3a3a]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              新建笔记
            </button>
            {!contextMenu.template.isSystem && (
              <>
                <button
                  onClick={() => handleEditTemplate(contextMenu.template)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                    isDark
                      ? 'text-[#e0e0e0] hover:bg-[#3a3a3a]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  编辑模板
                </button>
                <button
                  onClick={() => handleDeleteTemplate(contextMenu.template)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                    isDark
                      ? 'text-red-400 hover:bg-[#3a3a3a]'
                      : 'text-red-600 hover:bg-gray-100'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  删除模板
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 分类选择器 */}
      {showCategorySelector && (
        <div
          className={`category-selector-modal fixed z-50 w-64 max-h-64 overflow-y-auto rounded-lg shadow-lg border ${
            isDark 
              ? 'bg-[#2a2a2a] border-[#404040]' 
              : 'bg-white border-gray-200'
          }`}
          style={{
            left: Math.min(showCategorySelector.x, window.innerWidth - 256),
            top: Math.min(showCategorySelector.y, window.innerHeight - 256),
          }}
        >
          <div className={`p-2 border-b ${isDark ? 'border-[#404040]' : 'border-gray-200'}`}>
            <h4 className={`text-sm font-medium ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
            }`}>
              选择分类
            </h4>
          </div>
          <div className="py-1">
            {renderCategorySelector(buildCategoryTree())}
          </div>
        </div>
      )}

      {/* 标题输入框 */}
      {showTitleInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
            isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
            }`}>
              输入笔记标题
            </h3>
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="请输入笔记标题..."
              className={`w-full p-3 border rounded-lg ${
                isDark 
                  ? 'bg-[#1a1a1a] border-[#404040] text-[#e0e0e0] placeholder-[#a0a0a0]' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmCreateNote()
                } else if (e.key === 'Escape') {
                  setShowTitleInput(null)
                  setNewNoteTitle('')
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowTitleInput(null)
                  setNewNoteTitle('')
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-[#404040] text-[#e0e0e0] hover:bg-[#4a4a4a]'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleConfirmCreateNote}
                disabled={!newNoteTitle.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  newNoteTitle.trim()
                    ? isDark
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 模板名称输入框 */}
      {showTemplateNameInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
            isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
            }`}>
              输入模板名称
            </h3>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="请输入模板名称..."
              className={`w-full p-3 border rounded-lg ${
                isDark 
                  ? 'bg-[#1a1a1a] border-[#404040] text-[#e0e0e0] placeholder-[#a0a0a0]' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmCreateTemplate()
                } else if (e.key === 'Escape') {
                  setShowTemplateNameInput(false)
                  setNewTemplateName('')
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowTemplateNameInput(false)
                  setNewTemplateName('')
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-[#404040] text-[#e0e0e0] hover:bg-[#4a4a4a]'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleConfirmCreateTemplate}
                disabled={!newTemplateName.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  newTemplateName.trim()
                    ? isDark
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
