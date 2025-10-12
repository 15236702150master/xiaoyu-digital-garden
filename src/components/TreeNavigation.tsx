'use client'

import React, { useState } from 'react'
import { Search, ChevronRight, ChevronDown } from 'lucide-react'
import { Category, Note } from '@/types'
import ContextMenu from './ContextMenu'
import CategorySelector from './CategorySelector'

interface TreeNavigationProps {
  categories: Category[]
  notes: Note[]
  selectedNote?: Note
  isDark?: boolean
  onNoteSelect: (note: Note) => void
  onCategorySelect: (category: string) => void
  onAddNoteToCategory: (categoryName: string) => void
  onCreateNoteWithTitle: (categoryName: string, title: string) => void
  onAddCategory: (categoryName: string, parentId?: string) => void
  onEditCategory: (oldName: string, newName: string) => void
  onDeleteCategory: (categoryName: string) => void
  onRenameNote: (noteId: string, newTitle: string) => void
  onMoveNote: (noteId: string, targetCategory: string) => void
  onDeleteNote: (noteId: string) => void
}

export default function TreeNavigation({
  categories,
  notes,
  selectedNote,
  isDark,
  onNoteSelect,
  onCategorySelect,
  onAddNoteToCategory,
  onCreateNoteWithTitle,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onRenameNote,
  onMoveNote,
  onDeleteNote
}: TreeNavigationProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  
  // 当选中笔记变化时，自动展开其所在分类
  React.useEffect(() => {
    if (selectedNote) {
      setExpandedCategories(prev => {
        const newExpanded = new Set(prev)
        newExpanded.add(selectedNote.category)
        
        // 同时展开所有父分类
        const category = categories.find(c => c.name === selectedNote.category)
        if (category?.parentId) {
          const findAndExpandParents = (catId: string) => {
            const parent = categories.find(c => c.id === catId)
            if (parent) {
              newExpanded.add(parent.name)
              if (parent.parentId) {
                findAndExpandParents(parent.parentId)
              }
            }
          }
          findAndExpandParents(category.parentId)
        }
        
        return newExpanded
      })
    }
  }, [selectedNote, categories])
  const [contextMenu, setContextMenu] = useState<{ 
    x: number; 
    y: number; 
    type: 'category' | 'note';
    categoryName?: string; 
    categoryId?: string;
    noteTitle?: string;
    noteId?: string;
  } | null>(null)
  const [editingTitle, setEditingTitle] = useState<{ categoryName: string; title: string } | null>(null)
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null)
  const [editingNote, setEditingNote] = useState<{ noteId: string; title: string } | null>(null)
  const [addingCategory, setAddingCategory] = useState<{ parentId?: string } | false>(false)
  const [addingSubCategory, setAddingSubCategory] = useState<{ parentId: string } | false>(false)
  const [showCategorySelector, setShowCategorySelector] = useState<{ noteId: string; currentCategory: string } | null>(null)
  const [deepLevelNoteCreation, setDeepLevelNoteCreation] = useState<{ categoryName: string; level: number } | null>(null)

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const getCategoryNotes = (categoryName: string) => {
    const categoryNotes = notes.filter(note => note.category === categoryName)
    if (searchQuery) {
      return categoryNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return categoryNotes
  }

  const filteredCategories = categories.filter(category => {
    if (!searchQuery) return true
    const categoryNotes = getCategoryNotes(category.name)
    return categoryNotes.length > 0
  })

  // 构建分类树结构
  const buildCategoryTree = (parentId?: string): Category[] => {
    return filteredCategories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  // 递归渲染分类项
  const renderCategoryItem = (category: Category, level: number = 0) => {
    const categoryNotes = getCategoryNotes(category.name)
    const isExpanded = expandedCategories.has(category.name)
    const children = buildCategoryTree(category.id)
    const hasChildren = children.length > 0
    const hasContent = categoryNotes.length > 0 || hasChildren
    
    return (
      <div key={category.id} style={{ marginLeft: `${level * 16}px` }}>
        {editingCategory?.oldName === category.name ? (
          <div className="px-2 py-1.5">
            <input
              type="text"
              value={editingCategory.newName}
              onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editingCategory.newName.trim()) {
                  onEditCategory(editingCategory.oldName, editingCategory.newName.trim())
                  setEditingCategory(null)
                } else if (e.key === 'Escape') {
                  setEditingCategory(null)
                }
              }}
              onBlur={() => {
                if (editingCategory.newName.trim()) {
                  onEditCategory(editingCategory.oldName, editingCategory.newName.trim())
                }
                setEditingCategory(null)
              }}
              className="w-full px-2 py-1 text-xs rounded border bg-white border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => toggleCategory(category.name)}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                type: 'category',
                categoryName: category.name,
                categoryId: category.id
              })
            }}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left transition-all duration-200 group font-medium text-[rgb(104,103,103)] hover:text-[rgb(70,69,69)]"
          >
            <div className="w-3 h-3 flex items-center justify-center">
              {(hasContent || editingTitle?.categoryName === category.name) && (
                <div className="transition-transform duration-200 ease-in-out">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  )}
                </div>
              )}
            </div>
            <span className="text-xs font-semibold flex-1">{category.name}</span>
          </button>
        )}
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded && (hasContent || editingTitle?.categoryName === category.name) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="space-y-0 mt-0">
            {/* 渲染笔记 */}
            {categoryNotes.map((note) => (
              editingNote?.noteId === note.id ? (
                <div key={note.id} className="px-2 py-1.5" style={{ marginLeft: `${(level + 1) * 16 + 16}px` }}>
                  <input
                    type="text"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingNote.title.trim()) {
                        onRenameNote(editingNote.noteId, editingNote.title.trim())
                        setEditingNote(null)
                      } else if (e.key === 'Escape') {
                        setEditingNote(null)
                      }
                    }}
                    onBlur={() => {
                      if (editingNote.title.trim()) {
                        onRenameNote(editingNote.noteId, editingNote.title.trim())
                      }
                      setEditingNote(null)
                    }}
                    className="w-full px-2 py-1 text-xs rounded border bg-white border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  key={note.id}
                  onClick={() => onNoteSelect(note)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      type: 'note',
                      noteTitle: note.title,
                      noteId: note.id
                    })
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-left transition-all duration-200 group text-xs ${
                    selectedNote?.id === note.id
                      ? 'text-blue-600'
                      : 'text-[rgb(40,75,99)] hover:text-[rgb(132,201,184)]'
                  }`}
                  style={{ marginLeft: `${(level + 1) * 16 + 16}px` }}
                >
                  <span className="truncate">{note.title}</span>
                </button>
              )
            ))}
            
            {/* 内联编辑新笔记标题 */}
            {editingTitle?.categoryName === category.name && (
              <div className="px-2 py-1.5 bg-blue-50/50 rounded-md mx-2 mb-1" style={{ marginLeft: `${(level + 1) * 16}px` }}>
                <input
                  type="text"
                  value={editingTitle.title}
                  onChange={(e) => setEditingTitle({ ...editingTitle, title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editingTitle.title.trim()) {
                      onCreateNoteWithTitle(editingTitle.categoryName, editingTitle.title.trim())
                      setEditingTitle(null)
                    } else if (e.key === 'Escape') {
                      setEditingTitle(null)
                    }
                  }}
                  onBlur={() => {
                    if (editingTitle.title.trim()) {
                      onCreateNoteWithTitle(editingTitle.categoryName, editingTitle.title.trim())
                    }
                    setEditingTitle(null)
                  }}
                  placeholder="输入笔记标题..."
                  className="w-full px-3 py-2 text-sm rounded border border-blue-300 outline-none bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  autoFocus
                />
              </div>
            )}
            
            {/* 递归渲染子分类 */}
            {children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* 搜索框 */}
      <div className="relative mb-4">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索"
          className="w-full pl-7 pr-3 py-1.5 text-xs rounded transition-colors bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      {/* 添加新分类 */}
      {addingCategory && (
        <div className="mb-2">
          <input
            type="text"
            placeholder="输入分类名称..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const categoryName = (e.target as HTMLInputElement).value.trim()
                if (categoryName) {
                  onAddCategory(categoryName)
                  setAddingCategory(false)
                }
              } else if (e.key === 'Escape') {
                setAddingCategory(false)
              }
            }}
            onBlur={(e) => {
              const categoryName = e.target.value.trim()
              if (categoryName) {
                onAddCategory(categoryName)
              }
              setAddingCategory(false)
            }}
            className="w-full px-2 py-1.5 text-xs rounded border bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
        </div>
      )}

      {/* 添加子分类 */}
      {addingSubCategory && (
        <div className="mb-2 ml-4">
          <input
            type="text"
            placeholder="输入子分类名称..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const categoryName = (e.target as HTMLInputElement).value.trim()
                if (categoryName) {
                  onAddCategory(categoryName, addingSubCategory.parentId)
                  setAddingSubCategory(false)
                }
              } else if (e.key === 'Escape') {
                setAddingSubCategory(false)
              }
            }}
            onBlur={(e) => {
              const categoryName = e.target.value.trim()
              if (categoryName) {
                onAddCategory(categoryName, addingSubCategory.parentId)
              }
              setAddingSubCategory(false)
            }}
            className="w-full px-2 py-1.5 text-xs rounded border bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
        </div>
      )}

      {/* 分类导航 */}
      <div className="space-y-0">
        {buildCategoryTree().map(category => renderCategoryItem(category))}
      </div>

      {/* 如果搜索无结果 */}
      {searchQuery && filteredCategories.length === 0 && (
        <div className="text-center py-4 text-xs text-gray-400">
          未找到匹配的笔记
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          onClose={() => setContextMenu(null)}
          // 分类操作
          onAddNote={contextMenu.type === 'category' && contextMenu.categoryName ? () => {
            const category = categories.find(c => c.name === contextMenu.categoryName)
            const level = category?.level || 0
            
            if (level >= 4) {
              // 深层级使用弹窗
              setDeepLevelNoteCreation({ categoryName: contextMenu.categoryName!, level })
            } else {
              // 浅层级使用内联编辑
              setEditingTitle({ categoryName: contextMenu.categoryName!, title: '' })
              // 确保当前分类和所有父分类都展开
              const categoryToExpand = contextMenu.categoryName!
              setExpandedCategories(prev => {
                const newExpanded = new Set([...prev, categoryToExpand])
                // 同时展开所有父分类
                const category = categories.find(c => c.name === categoryToExpand)
                if (category?.parentId) {
                  const parentCategory = categories.find(c => c.id === category.parentId)
                  if (parentCategory) {
                    newExpanded.add(parentCategory.name)
                  }
                }
                return newExpanded
              })
            }
          } : undefined}
          onAddCategory={() => {
            setAddingCategory({})
          }}
          onAddSubCategory={contextMenu.type === 'category' && contextMenu.categoryId ? () => {
            setAddingSubCategory({ parentId: contextMenu.categoryId! })
          } : undefined}
          onEditCategory={contextMenu.type === 'category' && contextMenu.categoryName ? () => {
            setEditingCategory({ oldName: contextMenu.categoryName!, newName: contextMenu.categoryName! })
          } : undefined}
          onDeleteCategory={contextMenu.type === 'category' && contextMenu.categoryName ? () => {
            if (confirm(`确定要删除分类"${contextMenu.categoryName}"吗？\n\n该分类下的所有笔记和子分类将一并删除。`)) {
              onDeleteCategory(contextMenu.categoryName!)
            }
          } : undefined}
          categoryName={contextMenu.categoryName}
          categoryId={contextMenu.categoryId}
          // 笔记操作
          onEditNote={contextMenu.type === 'note' && contextMenu.noteId ? () => {
            const note = notes.find(n => n.id === contextMenu.noteId)
            if (note) {
              setEditingNote({ noteId: note.id, title: note.title })
            }
          } : undefined}
          onMoveNote={contextMenu.type === 'note' && contextMenu.noteId ? () => {
            const note = notes.find(n => n.id === contextMenu.noteId)
            if (note) {
              setShowCategorySelector({ noteId: note.id, currentCategory: note.category })
            }
          } : undefined}
          onDeleteNote={contextMenu.type === 'note' && contextMenu.noteId ? () => {
            if (confirm(`确定要删除笔记"${contextMenu.noteTitle}"吗？`)) {
              onDeleteNote(contextMenu.noteId!)
            }
          } : undefined}
          noteTitle={contextMenu.noteTitle}
          noteId={contextMenu.noteId}
          isDark={false}
        />
      )}

      {/* 分类选择器 */}
      {showCategorySelector && (
        <CategorySelector
          categories={categories}
          currentCategory={showCategorySelector.currentCategory}
          onSelect={(targetCategory) => {
            onMoveNote(showCategorySelector.noteId, targetCategory)
            setShowCategorySelector(null)
          }}
          onClose={() => setShowCategorySelector(null)}
          isDark={false}
        />
      )}

      {/* 深层级笔记创建弹窗 */}
      {deepLevelNoteCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20">
          <div className="w-96 rounded-lg shadow-xl bg-white border border-gray-200">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                创建笔记
              </h3>
              <button
                onClick={() => setDeepLevelNoteCreation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* 内容区 */}
            <div className="p-4">
              <div className="text-sm mb-3 text-gray-600">
                在分类 "<span className="font-medium">{deepLevelNoteCreation.categoryName}</span>" 中创建笔记
              </div>
              
              <input
                type="text"
                placeholder="输入笔记标题..."
                className="w-full px-3 py-2 rounded border bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    onCreateNoteWithTitle(deepLevelNoteCreation.categoryName, e.currentTarget.value.trim())
                    setDeepLevelNoteCreation(null)
                  } else if (e.key === 'Escape') {
                    setDeepLevelNoteCreation(null)
                  }
                }}
              />
              
              <div className="text-xs mt-2 text-gray-500">
                按 Enter 创建，按 Esc 取消
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
