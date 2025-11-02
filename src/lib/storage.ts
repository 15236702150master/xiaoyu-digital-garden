// 本地存储管理
import { Note, Category, Tag } from '@/types'

const STORAGE_KEYS = {
  NOTES: 'digital-garden-notes',
  CATEGORIES: 'digital-garden-categories',
  TAGS: 'digital-garden-tags'
}

// 存储工具函数
class StorageUtils {
  // 获取字符串的字节大小
  static getByteSize(str: string): number {
    return new Blob([str]).size
  }

  // 获取存储使用情况（MB）
  static getStorageSize(): number {
    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += this.getByteSize(localStorage[key] || '')
      }
    }
    return total / (1024 * 1024) // 转换为MB
  }

  // 检查是否可以存储
  static canStore(data: string): { success: boolean; message?: string; size?: number } {
    const dataSize = this.getByteSize(data)
    const dataSizeMB = dataSize / (1024 * 1024)
    const currentSize = this.getStorageSize()
    const estimatedTotal = currentSize + dataSizeMB

    // localStorage 通常限制为 5-10MB，这里设置为 8MB 作为警告阈值
    const WARNING_THRESHOLD = 8
    const MAX_THRESHOLD = 9.5

    if (estimatedTotal > MAX_THRESHOLD) {
      return {
        success: false,
        message: `存储空间不足！当前使用 ${currentSize.toFixed(2)}MB，此次保存需要 ${dataSizeMB.toFixed(2)}MB，总计 ${estimatedTotal.toFixed(2)}MB，已接近浏览器限制（约10MB）。\n\n建议：\n1. 删除一些不需要的笔记\n2. 将长笔记拆分为多篇\n3. 使用导出功能备份后清理数据`,
        size: dataSizeMB
      }
    }

    if (estimatedTotal > WARNING_THRESHOLD) {
      return {
        success: true,
        message: `警告：存储空间即将不足！当前使用 ${currentSize.toFixed(2)}MB / 约10MB。建议及时清理或导出数据。`,
        size: dataSizeMB
      }
    }

    return { success: true, size: dataSizeMB }
  }
}

// 笔记存储管理
export class NotesStorage {
  static getNotes(): Note[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEYS.NOTES)
    if (!stored) return []
    
    try {
      const notes = JSON.parse(stored)
      return notes
    } catch {
      return []
    }
  }

  static saveNotes(notes: Note[]): { success: boolean; message?: string } {
    if (typeof window === 'undefined') return { success: false, message: '服务端环境无法保存' }
    
    try {
      const data = JSON.stringify(notes)
      const checkResult = StorageUtils.canStore(data)
      
      if (!checkResult.success) {
        console.error('存储失败:', checkResult.message)
        // 尝试显示错误提示
        if (typeof window !== 'undefined' && checkResult.message) {
          alert(checkResult.message)
        }
        return { success: false, message: checkResult.message }
      }
      
      localStorage.setItem(STORAGE_KEYS.NOTES, data)
      
      // 如果有警告信息，在控制台显示
      if (checkResult.message) {
        console.warn(checkResult.message)
      }
      
      return { success: true, message: checkResult.message }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      console.error('保存笔记失败:', errorMessage)
      
      // 如果是 QuotaExceededError，提供更友好的提示
      if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceededError')) {
        const friendlyMessage = '存储空间已满！\n\n浏览器的本地存储空间已用完（约10MB限制）。\n\n建议：\n1. 删除一些旧笔记\n2. 将长笔记分割成多篇\n3. 使用批量导出功能备份数据后清理'
        alert(friendlyMessage)
        return { success: false, message: friendlyMessage }
      }
      
      return { success: false, message: `保存失败: ${errorMessage}` }
    }
  }

  static addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): { note: Note | null; success: boolean; message?: string } {
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const notes = this.getNotes()
    notes.unshift(newNote)
    const result = this.saveNotes(notes)
    
    if (!result.success) {
      return { note: null, success: false, message: result.message }
    }
    
    return { note: newNote, success: true, message: result.message }
  }

  static updateNote(id: string, updates: Partial<Note>): { note: Note | null; success: boolean; message?: string } {
    const notes = this.getNotes()
    const index = notes.findIndex(note => note.id === id)
    
    if (index === -1) return { note: null, success: false, message: '笔记不存在' }
    
    notes[index] = {
      ...notes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    const result = this.saveNotes(notes)
    
    if (!result.success) {
      return { note: null, success: false, message: result.message }
    }
    
    return { note: notes[index], success: true, message: result.message }
  }

  static deleteNote(id: string): boolean {
    const notes = this.getNotes()
    const filtered = notes.filter(note => note.id !== id)
    
    if (filtered.length === notes.length) return false
    
    this.saveNotes(filtered)
    return true
  }

  static moveNote(id: string, targetCategory: string): { note: Note | null; success: boolean; message?: string } {
    return this.updateNote(id, { category: targetCategory })
  }
}

// 分类存储管理
export class CategoriesStorage {
  static getCategories(): Category[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
    return stored ? JSON.parse(stored) : this.getDefaultCategories()
  }

  static getDefaultCategories(): Category[] {
    return [
      { id: '1', name: '学习笔记', icon: '📚', color: '#3b82f6', description: '学习相关的笔记' },
      { id: '2', name: '工作记录', icon: '💼', color: '#10b981', description: '工作相关的记录' },
      { id: '3', name: '生活感悟', icon: '🌱', color: '#f59e0b', description: '生活中的感悟和思考' },
      { id: '4', name: '技术分享', icon: '💻', color: '#8b5cf6', description: '技术相关的分享' },
      { id: '5', name: '随笔', icon: '✍️', color: '#ef4444', description: '随意记录的想法' }
    ]
  }

  static saveCategories(categories: Category[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
  }

  static addCategory(name: string, parentId?: string): Category | null {
    const categories = this.getCategories()
    
    // 检查是否已存在同名分类（在同一层级下）
    const siblings = parentId 
      ? categories.filter(cat => cat.parentId === parentId)
      : categories.filter(cat => !cat.parentId)
    
    if (siblings.some(cat => cat.name === name)) {
      return null
    }

    const parentLevel = parentId 
      ? (categories.find(cat => cat.id === parentId)?.level || 0)
      : -1

    const newCategory: Category = {
      id: crypto.randomUUID(),
      name,
      icon: '📁',
      color: this.getRandomColor(),
      description: `${name}相关的笔记`,
      parentId,
      level: parentLevel + 1
    }

    categories.push(newCategory)
    this.saveCategories(categories)
    return newCategory
  }

  static updateCategory(oldName: string, newName: string): boolean {
    const categories = this.getCategories()
    const index = categories.findIndex(cat => cat.name === oldName)
    
    if (index === -1) return false
    
    // 检查新名称是否已存在
    if (categories.some(cat => cat.name === newName && cat.name !== oldName)) {
      return false
    }

    categories[index] = {
      ...categories[index],
      name: newName
    }

    this.saveCategories(categories)
    return true
  }

  static deleteCategory(name: string): boolean {
    const categories = this.getCategories()
    const categoryToDelete = categories.find(cat => cat.name === name)
    
    if (!categoryToDelete) return false
    
    // 递归删除所有子分类
    const deleteWithChildren = (categoryId: string) => {
      const children = categories.filter(cat => cat.parentId === categoryId)
      children.forEach(child => deleteWithChildren(child.id))
      return categories.filter(cat => cat.id !== categoryId)
    }
    
    const filtered = deleteWithChildren(categoryToDelete.id)
    this.saveCategories(filtered)
    return true
  }

  // 构建层级分类树
  static buildCategoryTree(): Category[] {
    const categories = this.getCategories()
    const categoryMap = new Map<string, Category>()
    
    // 创建分类映射并初始化children数组
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })
    
    const rootCategories: Category[] = []
    
    // 构建树结构
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          parent.children!.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })
    
    return rootCategories
  }

  // 获取分类的完整路径
  static getCategoryPath(categoryName: string): string {
    const categories = this.getCategories()
    const category = categories.find(cat => cat.name === categoryName)
    
    if (!category) return categoryName
    
    const buildPath = (cat: Category): string => {
      if (!cat.parentId) return cat.name
      const parent = categories.find(c => c.id === cat.parentId)
      return parent ? `${buildPath(parent)} > ${cat.name}` : cat.name
    }
    
    return buildPath(category)
  }

  private static getRandomColor(): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16']
    return colors[Math.floor(Math.random() * colors.length)]
  }
}

// 标签存储管理
export class TagsStorage {
  static getTags(): Tag[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEYS.TAGS)
    return stored ? JSON.parse(stored) : []
  }

  static saveTags(tags: Tag[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags))
  }

  static updateTagCounts(notes: Note[]): void {
    const tagCounts = new Map<string, number>()
    
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const existingTags = this.getTags()
    const updatedTags = Array.from(tagCounts.entries()).map(([name, count]) => {
      const existing = existingTags.find(tag => tag.name === name)
      return {
        id: existing?.id || crypto.randomUUID(),
        name,
        color: existing?.color || this.getRandomColor(),
        count
      }
    })

    this.saveTags(updatedTags)
  }

  static addTag(name: string, color?: string): Tag {
    const tags = this.getTags()
    const existing = tags.find(tag => tag.name === name)
    if (existing) return existing

    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color: color || this.getRandomColor(),
      count: 0
    }

    tags.push(newTag)
    this.saveTags(tags)
    return newTag
  }

  static updateTag(id: string, updates: Partial<Tag>): Tag | null {
    const tags = this.getTags()
    const index = tags.findIndex(tag => tag.id === id)
    if (index === -1) return null

    tags[index] = { ...tags[index], ...updates }
    this.saveTags(tags)
    return tags[index]
  }

  static deleteTag(id: string): boolean {
    const tags = this.getTags()
    const index = tags.findIndex(tag => tag.id === id)
    if (index === -1) return false

    tags.splice(index, 1)
    this.saveTags(tags)
    return true
  }

  static getTagByName(name: string): Tag | null {
    const tags = this.getTags()
    return tags.find(tag => tag.name === name) || null
  }

  private static getRandomColor(): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16']
    return colors[Math.floor(Math.random() * colors.length)]
  }
}
