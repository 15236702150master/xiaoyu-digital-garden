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
import EasterEggModal from '../components/EasterEggModal'
import EasterEggProgress from '../components/EasterEggProgress'
import PlantGrowth from '../components/PlantGrowth'
import NightCompanionSimple from '../components/NightCompanionSimple'
import { 
  setEasterEggCallback,
  checkNoteMilestone,
  checkTimeBasedEasterEgg,
  checkKeywordEasterEgg,
  checkRapidCreate,
  checkDailyNoteCount,
  checkConsecutiveDays,
  checkRandomEasterEgg,
  checkFirstTagUse,
  checkFirstLinkUse,
  initEasterEggChecks,
  checkTagUsage,
  checkLinkCount,
  checkCategoryMaster,
  checkWeeklyNotes
} from '../utils/easterEggTriggers'
import { rainbowConfetti, starsConfetti } from '../utils/confettiEffects'
import { updateNoteWordCount, removeNoteWordCount, getStageConfig, recalculateAllWords } from '../utils/plantGrowthManager'
import { PlantStage } from '../types/plantGrowth'

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
  
  // 彩蛋系统状态
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false)
  const [easterEggTitle, setEasterEggTitle] = useState('')
  const [easterEggContent, setEasterEggContent] = useState('')
  const [easterEggIcon, setEasterEggIcon] = useState('🎉')
  
  // 点击标题彩蛋
  const [titleClickCount, setTitleClickCount] = useState(0)
  const [titleClickTimer, setTitleClickTimer] = useState<NodeJS.Timeout | null>(null)

  // 点击标题彩蛋处理
  const handleTitleClick = () => {
    const newCount = titleClickCount + 1
    setTitleClickCount(newCount)
    
    // 清除之前的计时器
    if (titleClickTimer) {
      clearTimeout(titleClickTimer)
    }
    
    // 如果点击5次，触发彩虹彩蛋
    if (newCount === 5) {
      rainbowConfetti()
      setEasterEggTitle('🌈 彩虹秘密！')
      setEasterEggContent('哇！你发现了隐藏的彩虹彩蛋！\n\n连续点击标题5次才能触发哦~\n\n你真是个细心的探索者！🎨')
      setEasterEggIcon('🌈')
      setIsEasterEggOpen(true)
      setTitleClickCount(0)
      setTitleClickTimer(null)
    } else {
      // 设置2秒后重置计数
      const timer = setTimeout(() => {
        setTitleClickCount(0)
      }, 2000)
      setTitleClickTimer(timer)
    }
  }
  
  // 初始化彩蛋系统
  useEffect(() => {
    // 设置彩蛋触发回调
    setEasterEggCallback((title, content, icon) => {
      setEasterEggTitle(title)
      setEasterEggContent(content)
      setEasterEggIcon(icon)
      setIsEasterEggOpen(true)
    })
    
    // 初始化彩蛋检查
    initEasterEggChecks()
  }, [])

  // 初始化数据
  useEffect(() => {
    const loadedNotes = NotesStorage.getNotes()
    let loadedCategories = CategoriesStorage.getCategories()
    
    // 数据一致性检查：确保所有笔记的分类都存在
    const categoryNames = new Set(loadedCategories.map(cat => cat.name))
    const missingCategories = new Set<string>()
    
    loadedNotes.forEach(note => {
      if (note.category && !categoryNames.has(note.category)) {
        missingCategories.add(note.category)
      }
    })
    
    // 自动创建缺失的分类
    if (missingCategories.size > 0) {
      console.log('发现缺失的分类，自动创建：', Array.from(missingCategories))
      missingCategories.forEach(categoryName => {
        CategoriesStorage.addCategory(categoryName)
      })
      loadedCategories = CategoriesStorage.getCategories()
    }
    
    setNotes(loadedNotes)
    setCategories(loadedCategories)
    
    // 更新标签计数
    TagsStorage.updateTagCounts(loadedNotes)
    
    // 初始化植物生长系统 - 重新计算所有笔记的字数
    if (loadedNotes.length > 0) {
      recalculateAllWords(loadedNotes)
      window.dispatchEvent(new Event('plantGrowthUpdated'))
    }
    
    // 检查周笔记统计
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weeklyNotes = loadedNotes.filter(note => {
      const noteDate = new Date(note.createdAt)
      return noteDate >= oneWeekAgo
    })
    checkWeeklyNotes(weeklyNotes.length)
    
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
        
        // 更新植物生长字数
        const result = updateNoteWordCount(editingNote.id, noteData.content || '')
        
        // 使用 setTimeout 确保状态已保存到 localStorage
        setTimeout(() => {
          // 通知植物组件更新
          window.dispatchEvent(new Event('plantGrowthUpdated'))
          
          if (result.stageChanged && result.newStage && result.oldStage) {
            // 触发阶段变化事件
            window.dispatchEvent(new CustomEvent('plantStageChanged', {
              detail: { newStage: result.newStage, oldStage: result.oldStage }
            }))
            
            // 如果达到结果阶段，触发特殊彩蛋
            if (result.newStage === 'fruit') {
              setEasterEggTitle('🍎 硕果累累！')
              setEasterEggContent('恭喜你！\n\n你的数字花园已经结出了丰硕的果实！\n\n总字数达到了 60,000 字！\n\n这是一个了不起的成就！\n\n继续创作，让知识之树更加茂盛！')
              setEasterEggIcon('🍎')
              setIsEasterEggOpen(true)
              starsConfetti()
            }
          }
        }, 0)
        
        // 彩蛋检测：关键词触发
        checkKeywordEasterEgg(noteData.title || '', noteData.content || '')
        
        // 彩蛋检测：检查标签使用
        if (noteData.tags && noteData.tags.length > 0) {
          checkFirstTagUse()
          
          // 检查每个标签被使用的次数
          const allNotes = NotesStorage.getNotes()
          noteData.tags.forEach(tag => {
            const tagCount = allNotes.filter(note => note.tags.includes(tag)).length
            checkTagUsage(tag, tagCount)
          })
        }
        
        // 彩蛋检测：检查双向链接使用
        if (noteData.content && noteData.content.includes('[[')) {
          checkFirstLinkUse()
          
          // 统计双向链接数量
          const linkMatches = noteData.content.match(/\[\[([^\]]+)\]\]/g)
          if (linkMatches) {
            checkLinkCount(linkMatches.length)
          }
        }
        
        // 彩蛋检测：检查分类使用
        const allNotes = NotesStorage.getNotes()
        const usedCategories = [...new Set(allNotes.map(note => note.category).filter(cat => cat !== '未分类'))]
        checkCategoryMaster(usedCategories)
      }
    } else {
      // 创建新笔记
      const newNote = NotesStorage.addNote(noteData)
      const allNotes = NotesStorage.getNotes()
      setNotes(allNotes)
      TagsStorage.updateTagCounts(allNotes)
      
      // 更新植物生长字数（新笔记）
      if (newNote) {
        const result = updateNoteWordCount(newNote.id, noteData.content || '')
        
        // 使用 setTimeout 确保状态已保存到 localStorage
        setTimeout(() => {
          // 通知植物组件更新
          window.dispatchEvent(new Event('plantGrowthUpdated'))
          
          if (result.stageChanged && result.newStage && result.oldStage) {
            // 触发阶段变化事件
            window.dispatchEvent(new CustomEvent('plantStageChanged', {
              detail: { newStage: result.newStage, oldStage: result.oldStage }
            }))
            
            // 如果达到结果阶段，触发特殊彩蛋
            if (result.newStage === 'fruit') {
              setEasterEggTitle('🍎 硕果累累！')
              setEasterEggContent('恭喜你！\n\n你的数字花园已经结出了丰硕的果实！\n\n总字数达到了 60,000 字！\n\n这是一个了不起的成就！\n\n继续创作，让知识之树更加茂盛！')
              setEasterEggIcon('🍎')
              setIsEasterEggOpen(true)
              starsConfetti()
            }
          }
        }, 0)
      }
      
      // 彩蛋检测：笔记数量里程碑
      checkNoteMilestone(allNotes.length)
      
      // 彩蛋检测：快速连续创建
      checkRapidCreate()
      
      // 彩蛋检测：单日创建数量
      checkDailyNoteCount()
      
      // 彩蛋检测：连续天数
      checkConsecutiveDays()
      
      // 彩蛋检测：关键词触发
      checkKeywordEasterEgg(noteData.title || '', noteData.content || '')
      
      // 彩蛋检测：随机彩蛋（1%概率）
      checkRandomEasterEgg()
      
      // 彩蛋检测：时间相关
      checkTimeBasedEasterEgg()
      
      // 彩蛋检测：检查标签使用
      if (noteData.tags && noteData.tags.length > 0) {
        checkFirstTagUse()
        
        // 检查每个标签被使用的次数
        noteData.tags.forEach(tag => {
          const tagCount = allNotes.filter(note => note.tags.includes(tag)).length
          checkTagUsage(tag, tagCount)
        })
      }
      
      // 彩蛋检测：检查双向链接使用
      if (noteData.content && noteData.content.includes('[[')) {
        checkFirstLinkUse()
        
        // 统计双向链接数量
        const linkMatches = noteData.content.match(/\[\[([^\]]+)\]\]/g)
        if (linkMatches) {
          checkLinkCount(linkMatches.length)
        }
      }
      
      // 彩蛋检测：检查分类使用
      const usedCategories = [...new Set(allNotes.map(note => note.category).filter(cat => cat !== '未分类'))]
      checkCategoryMaster(usedCategories)
      
      // 彩蛋检测：检查周笔记统计
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const weeklyNotes = allNotes.filter(note => {
        const noteDate = new Date(note.createdAt)
        return noteDate >= oneWeekAgo
      })
      checkWeeklyNotes(weeklyNotes.length)
    }
    
    setIsEditorOpen(false)
    setEditingNote(undefined)
  }

  // 删除笔记
  const handleDeleteNote = (id: string) => {
    const deleted = NotesStorage.deleteNote(id)
    if (deleted) {
      // 更新植物生长字数（删除笔记）
      removeNoteWordCount(id)
      
      // 使用 setTimeout 确保状态已保存
      setTimeout(() => {
        window.dispatchEvent(new Event('plantGrowthUpdated'))
      }, 0)
      
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
    
    const createdNote = NotesStorage.addNote(noteData)
    const allNotes = NotesStorage.getNotes()
    setNotes(allNotes)
    TagsStorage.updateTagCounts(allNotes)
    
    // 更新植物生长字数（新笔记，内容为空）
    if (createdNote) {
      updateNoteWordCount(createdNote.id, '')
      
      // 使用 setTimeout 确保状态已保存
      setTimeout(() => {
        window.dispatchEvent(new Event('plantGrowthUpdated'))
      }, 0)
    }
    
    // 彩蛋检测：笔记数量里程碑
    checkNoteMilestone(allNotes.length)
    
    // 彩蛋检测：快速连续创建
    checkRapidCreate()
    
    // 彩蛋检测：单日创建数量
    checkDailyNoteCount()
    
    // 彩蛋检测：连续天数
    checkConsecutiveDays()
    
    // 彩蛋检测：时间相关
    checkTimeBasedEasterEgg()
    
    // 彩蛋检测：随机彩蛋（1%概率）
    checkRandomEasterEgg()
    
    // 彩蛋检测：检查分类使用
    const usedCategories = [...new Set(allNotes.map(note => note.category).filter(cat => cat !== '未分类'))]
    checkCategoryMaster(usedCategories)
    
    // 彩蛋检测：检查周笔记统计
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weeklyNotes = allNotes.filter(note => {
      const noteDate = new Date(note.createdAt)
      return noteDate >= oneWeekAgo
    })
    checkWeeklyNotes(weeklyNotes.length)
    
    // 选择新创建的笔记
    const newNote = allNotes.find(note => note.title === title && note.category === categoryName)
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
    const allNotes = NotesStorage.getNotes()
    setNotes(allNotes)
    TagsStorage.updateTagCounts(allNotes)
    
    // 更新植物生长字数（模板笔记）
    if (newNote) {
      const result = updateNoteWordCount(newNote.id, template.content || '')
      
      // 使用 setTimeout 确保状态已保存到 localStorage
      setTimeout(() => {
        // 通知植物组件更新
        window.dispatchEvent(new Event('plantGrowthUpdated'))
        
        if (result.stageChanged && result.newStage && result.oldStage) {
          // 触发阶段变化事件
          window.dispatchEvent(new CustomEvent('plantStageChanged', {
            detail: { newStage: result.newStage, oldStage: result.oldStage }
          }))
          
          // 如果达到结果阶段，触发特殊彩蛋
          if (result.newStage === 'fruit') {
            setEasterEggTitle('🍎 硕果累累！')
            setEasterEggContent('恭喜你！\n\n你的数字花园已经结出了丰硕的果实！\n\n总字数达到了 60,000 字！\n\n这是一个了不起的成就！\n\n继续创作，让知识之树更加茂盛！')
            setEasterEggIcon('🍎')
            setIsEasterEggOpen(true)
            starsConfetti()
          }
        }
      }, 0)
    }
    
    // 彩蛋检测：笔记数量里程碑
    checkNoteMilestone(allNotes.length)
    
    // 彩蛋检测：快速连续创建
    checkRapidCreate()
    
    // 彩蛋检测：单日创建数量
    checkDailyNoteCount()
    
    // 彩蛋检测：连续天数
    checkConsecutiveDays()
    
    // 彩蛋检测：时间相关
    checkTimeBasedEasterEgg()
    
    // 彩蛋检测：随机彩蛋（1%概率）
    checkRandomEasterEgg()
    
    // 彩蛋检测：检查分类使用
    const usedCategories = [...new Set(allNotes.map(note => note.category).filter(cat => cat !== '未分类'))]
    checkCategoryMaster(usedCategories)
    
    // 彩蛋检测：检查周笔记统计
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weeklyNotes = allNotes.filter(note => {
      const noteDate = new Date(note.createdAt)
      return noteDate >= oneWeekAgo
    })
    checkWeeklyNotes(weeklyNotes.length)
    
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
            <div className="flex items-center gap-2">
              <h1 
                className="text-xl font-normal text-[#52575b] cursor-pointer select-none hover:scale-105 transition-transform"
                onClick={handleTitleClick}
                title="试试连续点击我5次？"
              >
                🌱小宇的数字花园
              </h1>
              
              {/* 隐藏彩蛋：游戏入口 */}
              <a
                href="https://moyu.aolifu.org"
                target="_blank"
                rel="noopener noreferrer"
                className="w-2 h-2 rounded-full bg-yellow-400 opacity-30 hover:opacity-100 hover:scale-150 transition-all duration-300 cursor-pointer"
                title="🎮"
              />
            </div>
            
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
              <EasterEggProgress isDark={false} />
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
              
              {/* 隐藏彩蛋：音乐入口1 */}
              <div className="mt-8 flex items-center justify-center">
                <a
                  href="https://www.bilibili.com/video/BV1xN411x76o/?spm_id_from=333.337.search-card.all.click&vd_source=ab70b8ff38f91c6b463caa170bb1281f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-1.5 h-1.5 rounded-full bg-pink-400 opacity-20 hover:opacity-100 hover:scale-[2] transition-all duration-300"
                  title="🎵"
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
                <div className="text-center relative">
                  <div className="text-6xl mb-4">🌱</div>
                  <h2 className="text-2xl font-bold mb-4 text-[#2d3748]">
                    欢迎来到小宇的数字花园
                  </h2>
                  <p className="text-lg text-[#666]">
                    在这里记录你的想法，让知识生根发芽
                  </p>
                  
                  {/* 隐藏彩蛋：游戏入口2 */}
                  <a
                    href="https://cn.freegame.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-green-400 opacity-25 hover:opacity-100 hover:scale-150 transition-all duration-300"
                    title="🎯"
                  />
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
              
              {/* 隐藏彩蛋：音乐入口2 - 移到右侧 */}
              <div className="flex justify-center mt-8">
                <a
                  href="https://www.bilibili.com/video/BV1m2pTzCEXc/?spm_id_from=333.337.search-card.all.click&vd_source=ab70b8ff38f91c6b463caa170bb1281f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-20 hover:opacity-100 hover:scale-[2] transition-all duration-300"
                  title="🎶"
                />
              </div>
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

      {/* 彩蛋弹窗 */}
      <EasterEggModal
        isOpen={isEasterEggOpen}
        onClose={() => setIsEasterEggOpen(false)}
        title={easterEggTitle}
        content={easterEggContent}
        icon={easterEggIcon}
      />

      {/* 植物生长系统 */}
      <PlantGrowth
        onStageChange={(newStage, oldStage) => {
          const newConfig = getStageConfig(newStage as PlantStage)
          const oldConfig = getStageConfig(oldStage as PlantStage)
          
          // 显示升级彩蛋（除了结果阶段，结果阶段已经单独处理）
          if (newStage !== 'fruit') {
            setEasterEggTitle(`${newConfig.emoji} 植物升级！`)
            setEasterEggContent(`恭喜！你的植物成长了！\n\n从 ${oldConfig.name} 升级到 ${newConfig.name}！\n\n${newConfig.description}\n\n继续写作，让你的花园更加繁茂！`)
            setEasterEggIcon(newConfig.emoji)
            setIsEasterEggOpen(true)
          }
        }}
      />

      {/* 深夜陪伴模式 */}
      <NightCompanionSimple />

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
