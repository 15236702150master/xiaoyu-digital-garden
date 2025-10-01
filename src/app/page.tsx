'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Hash, Cloud, Download, FileText } from 'lucide-react'
import TreeNavigation from '../components/TreeNavigation'
import NoteDetailView from '../components/NoteDetailView'
import RecentNotes from '../components/RecentNotes'
import GlobalSearch from '../components/GlobalSearch'
import BackupManager from '../components/BackupManager'
import ColorPicker from '../components/ColorPicker'
import TagManager from '../components/TagManager'
// import CloudStorage from '../components/CloudStorage' // 已删除云存储功能
import BatchExportModal from '../components/BatchExportModal'
import ResizableLayout from '../components/ResizableLayout'
import { Note, Category, NoteTemplate } from '../types'
import { NotesStorage, CategoriesStorage, TagsStorage } from '../lib/storage'
import { TemplateStorage } from '../lib/templateStorage'
import ArticleView from '../components/ArticleView'
import NoteEditor from '../components/NoteEditor'
import TableOfContents from '../components/TableOfContents'
import BacklinksPanel from '../components/BacklinksPanel'
import AnnotationsPanel from '../components/AnnotationsPanel'
import TemplateManager from '../components/TemplateManager'
import FontSelector from '../components/FontSelector'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | undefined>()
  const [selectedNote, setSelectedNote] = useState<Note | undefined>()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false)
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false)
  const [isTemplateEditing, setIsTemplateEditing] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | undefined>()
  // const [isCloudStorageOpen, setIsCloudStorageOpen] = useState(false) // 已删除云存储功能
  const [backgroundColor, setBackgroundColor] = useState('#f8f9fa')
  const [selectedFont, setSelectedFont] = useState('system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif')

  // 初始化数据
  useEffect(() => {
    const loadedNotes = NotesStorage.getNotes()
    const loadedCategories = CategoriesStorage.getCategories()
    
    setNotes(loadedNotes)
    setCategories(loadedCategories)
    
    // 更新标签计数
    TagsStorage.updateTagCounts(loadedNotes)
    
    // 加载保存的字体设置
    const savedFont = localStorage.getItem('digital-garden-font')
    if (savedFont) {
      setSelectedFont(savedFont)
    }
    
    // 如果没有笔记，添加一些示例数据
    if (loadedNotes.length === 0) {
      const sampleNotes = [
        {
          title: 'React 18 新特性学习笔记',
          content: '深入了解 React 18 的并发特性和 Suspense 改进。Concurrent Features 让 React 能够中断渲染工作，优先处理更重要的更新。Automatic Batching 自动批处理多个状态更新，提升性能。',
          category: '学习笔记',
          tags: ['React', '前端', 'JavaScript'],
          isPublished: true
        },
        {
          title: 'AI 辅助编程工具对比',
          content: '对比了 GitHub Copilot、Cursor 等 AI 编程助手的特点。GitHub Copilot 在代码补全方面表现优秀，Cursor 在整体开发体验上更加智能。',
          category: '技术分享',
          tags: ['AI', '编程工具', '效率'],
          isPublished: true
        },
        {
          title: '数字花园设计思路',
          content: '构建个人知识管理系统的一些想法。采用卡片式笔记，支持标签分类，实现知识的网状连接。重点是要让知识能够自然生长，形成有机的知识网络。',
          category: '随笔',
          tags: ['知识管理', '设计思路', '个人成长'],
          isPublished: false
        }
      ]
      
      sampleNotes.forEach(noteData => {
        NotesStorage.addNote(noteData)
      })
      
      setNotes(NotesStorage.getNotes())
      TagsStorage.updateTagCounts(NotesStorage.getNotes())
    }
  }, [])

  // 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])


  // 处理背景颜色变化
  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color)
    localStorage.setItem('digital-garden-background-color', color)
  }

  // 保存笔记
  const handleSaveNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingNote) {
      // 更新现有笔记
      const updatedNote = NotesStorage.updateNote(editingNote.id, noteData)
      if (updatedNote) {
        setNotes(NotesStorage.getNotes())
        TagsStorage.updateTagCounts(NotesStorage.getNotes())
      }
    } else {
      // 创建新笔记
      NotesStorage.addNote(noteData)
      setNotes(NotesStorage.getNotes())
      TagsStorage.updateTagCounts(NotesStorage.getNotes())
    }
    
    setIsEditorOpen(false)
    setEditingNote(undefined)
  }

  // 删除笔记
  const handleDeleteNote = (id: string) => {
    const deleted = NotesStorage.deleteNote(id)
    if (deleted) {
      setNotes(NotesStorage.getNotes())
      TagsStorage.updateTagCounts(NotesStorage.getNotes())
      // 如果删除的是当前选中的笔记，清除选中状态
      if (selectedNote?.id === id) {
        setSelectedNote(undefined)
      }
    }
  }

  // 重命名笔记
  const handleRenameNote = (noteId: string, newTitle: string) => {
    const updatedNote = NotesStorage.updateNote(noteId, { title: newTitle })
    if (updatedNote) {
      setNotes(NotesStorage.getNotes())
      // 如果重命名的是当前选中的笔记，更新选中状态
      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNote)
      }
    }
  }

  // 移动笔记
  const handleMoveNote = (noteId: string, targetCategory: string) => {
    const updatedNote = NotesStorage.moveNote(noteId, targetCategory)
    if (updatedNote) {
      setNotes(NotesStorage.getNotes())
      // 如果移动的是当前选中的笔记，更新选中状态
      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNote)
      }
    }
  }

  // 选择笔记
  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note)
  }

  // 数据恢复后刷新
  const handleDataRestore = () => {
    setNotes(NotesStorage.getNotes())
    setCategories(CategoriesStorage.getCategories())
    TagsStorage.updateTagCounts(NotesStorage.getNotes())
    setSelectedNote(undefined)
    setSelectedCategory('全部')
  }

  // 添加分类
  const handleAddCategory = (categoryName: string, parentId?: string) => {
    const newCategory = CategoriesStorage.addCategory(categoryName, parentId)
    if (newCategory) {
      setCategories(CategoriesStorage.getCategories())
    }
  }

  // 编辑分类
  const handleEditCategory = (oldName: string, newName: string) => {
    const updated = CategoriesStorage.updateCategory(oldName, newName)
    if (updated) {
      setCategories(CategoriesStorage.getCategories())
      // 更新所有使用该分类的笔记
      const updatedNotes = notes.map(note => 
        note.category === oldName ? { ...note, category: newName } : note
      )
      updatedNotes.forEach(note => {
        if (note.category === newName) {
          NotesStorage.updateNote(note.id, note)
        }
      })
      setNotes(NotesStorage.getNotes())
      
      // 如果当前选中的分类被重命名，更新选中状态
      if (selectedCategory === oldName) {
        setSelectedCategory(newName)
      }
    }
  }

  // 删除分类
  const handleDeleteCategory = (categoryName: string) => {
    // 将该分类下的所有笔记移动到"未分类"
    const categoryNotes = notes.filter(note => note.category === categoryName)
    categoryNotes.forEach(note => {
      NotesStorage.updateNote(note.id, { ...note, category: '未分类' })
    })
    
    // 删除分类
    CategoriesStorage.deleteCategory(categoryName)
    setCategories(CategoriesStorage.getCategories())
    setNotes(NotesStorage.getNotes())
    
    // 如果当前选中的分类被删除，切换到"全部"
    if (selectedCategory === categoryName) {
      setSelectedCategory('全部')
    }
  }

  // 分类选择
  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName)
    setSelectedNote(undefined)
  }

  // 在指定分类下添加笔记
  const handleAddNoteToCategory = (categoryName: string) => {
    setSelectedCategory(categoryName)
    setEditingNote(undefined)
    setIsEditorOpen(true)
  }


  // 使用指定标题创建笔记
  const handleCreateNoteWithTitle = (categoryName: string, title: string) => {
    const noteData = {
      title,
      content: '',
      category: categoryName,
      tags: [],
      isPublished: true
    }
    
    NotesStorage.addNote(noteData)
    setNotes(NotesStorage.getNotes())
    TagsStorage.updateTagCounts(NotesStorage.getNotes())
    
    // 选择新创建的笔记
    const newNotes = NotesStorage.getNotes()
    const newNote = newNotes.find(note => note.title === title && note.category === categoryName)
    if (newNote) {
      setSelectedNote(newNote)
      setSelectedCategory(categoryName)
    }
  }

  // 基于模板创建笔记
  const handleCreateNoteFromTemplate = (template: NoteTemplate, title: string, categoryName: string) => {
    const noteData = {
      title,
      content: template.content,
      category: categoryName,
      tags: template.tags || [],
      isPublished: true
    }
    
    const newNote = NotesStorage.addNote(noteData)
    
    // 更新状态
    const updatedNotes = NotesStorage.getNotes()
    setNotes(updatedNotes)
    TagsStorage.updateTagCounts(updatedNotes)
    
    // 选择新创建的笔记
    if (newNote) {
      setSelectedNote(newNote)
      setSelectedCategory(categoryName)
    }
  }

  // 创建新模板
  const handleCreateTemplate = (templateName: string) => {
    // 创建一个空的模板笔记用于编辑
    const templateNote: Note = {
      id: `template-${Date.now()}`,
      title: templateName,
      content: '',
      category: '模板',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false
    }
    
    // 直接在主页面中编辑，不使用模态框
    setSelectedNote(templateNote)
    setIsTemplateEditing(true)
    setEditingTemplate(undefined) // 新建模板，不是编辑现有模板
  }

  // 编辑模板
  const handleEditTemplate = (template: NoteTemplate) => {
    // 将模板转换为笔记格式用于编辑
    const templateNote: Note = {
      id: `template-${template.id}`,
      title: template.name,
      content: template.content,
      category: template.category || '模板',
      tags: template.tags || [],
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      isPublished: false
    }
    
    // 直接在主页面中编辑，不使用模态框
    setSelectedNote(templateNote)
    setEditingTemplate(template)
    setIsTemplateEditing(true)
  }

  // 保存模板
  const handleSaveTemplate = (noteData: Partial<Note>) => {
    if (!selectedNote || !isTemplateEditing) return

    if (editingTemplate) {
      // 更新现有模板
      TemplateStorage.updateTemplate({
        id: editingTemplate.id,
        name: noteData.title || editingTemplate.name,
        content: noteData.content || editingTemplate.content,
        tags: noteData.tags || editingTemplate.tags,
        category: noteData.category || editingTemplate.category
      })
    } else {
      // 创建新模板
      const templateData = {
        name: noteData.title || selectedNote.title,
        content: noteData.content || '',
        tags: noteData.tags || [],
        category: noteData.category || '模板'
      }
      
      TemplateStorage.createTemplate(templateData)
    }

    // 重置状态
    setIsTemplateEditing(false)
    setEditingTemplate(undefined)
    setSelectedNote(undefined)
  }

  // 处理字体变更
  const handleFontChange = (font: string) => {
    setSelectedFont(font)
    localStorage.setItem('digital-garden-font', font)
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-300 text-[#52575b]"
      style={{ backgroundColor: backgroundColor }}
    >
      <header className="">
        <div className="max-w-7xl ml-4 mr-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-normal text-[#52575b]">
              🌱小宇的数字花园
            </h1>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg transition-colors bg-white text-[#52575b] hover:bg-gray-50"
                title="搜索 (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsTagManagerOpen(true)}
                className="p-2 rounded-lg transition-colors bg-white text-[#52575b] hover:bg-gray-50"
                title="标签管理"
              >
                <Hash className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsBatchExportOpen(true)}
                className="p-2 rounded-lg transition-colors bg-white text-[#52575b] hover:bg-gray-50"
                title="批量导出"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsTemplateManagerOpen(true)}
                className="p-2 rounded-lg transition-colors bg-white text-[#52575b] hover:bg-gray-50"
                title="模板管理"
              >
                <FileText className="w-5 h-5" />
              </button>
              {/* 云存储按钮已删除
              <button
                onClick={() => setIsCloudStorageOpen(true)}
                className="p-2 rounded-lg transition-colors bg-white text-[#52575b] hover:bg-gray-50"
                title="云存储"
              >
                <Cloud className="w-5 h-5" />
              </button>
              */}
              <BackupManager 
                isDark={false} 
                onDataRestore={handleDataRestore}
              />
              <ColorPicker
                isDark={false}
                onColorChange={handleBackgroundColorChange}
                currentColor={backgroundColor}
              />
              <FontSelector
                isDark={false}
                onFontChange={handleFontChange}
                currentFont={selectedFont}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="h-[calc(100vh-120px)]">
        <ResizableLayout
          isDark={false}
          leftPanel={
            <div className="p-4">
              <h2 className="text-sm font-semibold mb-3 text-[#2d3748]">
                导航
              </h2>
              <TreeNavigation
                categories={categories}
                notes={notes}
                selectedNote={selectedNote}
                isDark={false}
                onNoteSelect={handleNoteSelect}
                onCategorySelect={handleCategorySelect}
                onAddNoteToCategory={handleAddNoteToCategory}
                onCreateNoteWithTitle={handleCreateNoteWithTitle}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onRenameNote={handleRenameNote}
                onMoveNote={handleMoveNote}
                onDeleteNote={handleDeleteNote}
              />
              
              {/* 最近的笔记 */}
              <div className="mt-6">
                <RecentNotes 
                  notes={notes} 
                  isDark={false}
                  onNoteSelect={handleNoteSelect}
                  selectedNote={selectedNote}
                />
              </div>
            </div>
          }
          centerPanel={
            selectedNote ? (
              <NoteDetailView
                note={selectedNote}
                isDark={false}
                notes={notes}
                fontFamily={selectedFont}
                onSave={isTemplateEditing ? handleSaveTemplate : (noteData) => {
                  const updatedNote = NotesStorage.updateNote(selectedNote.id, noteData)
                  if (updatedNote) {
                    setNotes(NotesStorage.getNotes())
                    TagsStorage.updateTagCounts(NotesStorage.getNotes())
                    setSelectedNote(updatedNote)
                  }
                }}
                onNoteSelect={setSelectedNote}
              />
            ) : (
              <div className="p-8 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🌱</div>
                  <h2 className="text-2xl font-bold mb-4 text-[#2d3748]">
                    欢迎来到小宇的数字花园
                  </h2>
                  <p className="text-lg text-[#666]">
                    在这里记录你的想法，让知识生根发芽
                  </p>
                </div>
              </div>
            )
          }
          rightPanel={
            <div className="p-4 space-y-6">
              {/* 目录导航 - 仅在选中笔记且有标题时显示 */}
              {selectedNote && selectedNote.content && (() => {
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = selectedNote.content
                const allHeadings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, .custom-heading-1, .custom-heading-2, .custom-heading-3')
                return allHeadings.length > 0
              })() && (
                <TableOfContents 
                  content={selectedNote.content} 
                  isDark={false}
                />
              )}

              {/* 双向链接面板 - 仅在选中笔记时显示 */}
              {selectedNote && (
                <BacklinksPanel
                  currentNote={selectedNote}
                  allNotes={notes}
                  onNoteSelect={handleNoteSelect}
                  isDark={false}
                />
              )}

              {/* 备注面板 - 仅在选中笔记时显示 */}
              {selectedNote && (
                <AnnotationsPanel
                  currentNote={selectedNote}
                  onNoteUpdate={(noteData) => {
                    const updatedNote = NotesStorage.updateNote(selectedNote.id, noteData)
                    if (updatedNote) {
                      setNotes(NotesStorage.getNotes())
                      setSelectedNote(updatedNote)
                    }
                  }}
                  isDark={false}
                />
              )}
            </div>
          }
        />
      </div>

      {/* 笔记编辑器 - 仅用于非模板编辑 */}
      {isEditorOpen && !isTemplateEditing && (
        <NoteEditor
          note={editingNote}
          categories={categories}
          isDark={false}
          onSave={handleSaveNote}
          onCancel={() => {
            setIsEditorOpen(false)
            setEditingNote(undefined)
          }}
        />
      )}

      {/* 全局搜索 */}
      <GlobalSearch
        notes={notes}
        isDark={false}
        onNoteSelect={handleNoteSelect}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* 标签管理器 */}
      {isTagManagerOpen && (
        <TagManager
          onClose={() => setIsTagManagerOpen(false)}
          isDark={false}
        />
      )}

      {/* 批量导出模态框 */}
      {isBatchExportOpen && (
        <BatchExportModal
          isOpen={isBatchExportOpen}
          onClose={() => setIsBatchExportOpen(false)}
          notes={notes}
          categories={categories}
          isDark={false}
        />
      )}

      {/* 模板管理器 */}
      {isTemplateManagerOpen && (
        <TemplateManager
          isOpen={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
          onCreateNoteFromTemplate={handleCreateNoteFromTemplate}
          onCreateTemplate={handleCreateTemplate}
          onEditTemplate={handleEditTemplate}
          categories={categories}
          isDark={false}
        />
      )}

      {/* 云存储管理器已删除
      {isCloudStorageOpen && (
        <CloudStorage
          onClose={() => setIsCloudStorageOpen(false)}
          isDark={false}
        />
      )}
      */}

      {/* 全局样式 */}
      <style jsx global>{`
        .text-with-note {
          position: relative;
        }
        
        .text-with-note:hover {
          background: rgba(59, 130, 246, 0.1);
          border-radius: 2px;
        }
        
        .highlight-annotation {
          background: rgba(59, 130, 246, 0.3) !important;
          border-radius: 4px;
          padding: 2px 4px;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  )
}
