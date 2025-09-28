'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Hash } from 'lucide-react'
import { Note, Category } from '../types'
import { NotesStorage, CategoriesStorage, TagsStorage } from '../lib/storage'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | undefined>()

  // 初始化数据
  useEffect(() => {
    const loadedNotes = NotesStorage.getNotes()
    const loadedCategories = CategoriesStorage.getCategories()
    
    setNotes(loadedNotes)
    setCategories(loadedCategories)
    
    // 更新标签计数
    TagsStorage.updateTagCounts(loadedNotes)
    
    // 如果没有笔记，添加一些示例数据
    if (loadedNotes.length === 0) {
      const sampleNotes = [
        {
          title: 'React 18 新特性学习笔记',
          content: '深入了解 React 18 的并发特性和 Suspense 改进。',
          category: '学习笔记',
          tags: ['React', '前端', 'JavaScript'],
          isPublished: true
        },
        {
          title: 'AI 辅助编程工具对比',
          content: '对比了 GitHub Copilot、Cursor 等 AI 编程助手的特点。',
          category: '技术分享',
          tags: ['AI', '编程工具', '效率'],
          isPublished: true
        },
        {
          title: '数字花园设计思路',
          content: '构建个人知识管理系统的一些想法。',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              🌱 数字花园
            </h1>
            
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg transition-colors bg-white text-gray-600 hover:bg-gray-50">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg transition-colors bg-white text-gray-600 hover:bg-gray-50">
                <Hash className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-medium mb-4">分类</h2>
              <div className="space-y-2">
                {categories.map(category => (
                  <div key={category.id} className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    {category.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
              <h2 className="font-medium mb-4">最近笔记</h2>
              <div className="space-y-2">
                {notes.slice(0, 5).map(note => (
                  <div 
                    key={note.id} 
                    className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                    onClick={() => setSelectedNote(note)}
                  >
                    {note.title}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {selectedNote ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold mb-4">{selectedNote.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <span>分类: {selectedNote.category}</span>
                  <span>标签: {selectedNote.tags?.join(', ') || '无'}</span>
                  <span>创建: {new Date(selectedNote.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedNote.content.replace(/\n/g, '<br>') }} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="text-gray-500">
                  <h3 className="text-lg font-medium mb-2">欢迎来到数字花园</h3>
                  <p className="text-sm">选择一个笔记开始阅读，或者创建一个新的笔记</p>
                  <div className="mt-6">
                    <p className="text-xs text-gray-400">
                      当前共有 {notes.length} 篇笔记，{categories.length} 个分类
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
