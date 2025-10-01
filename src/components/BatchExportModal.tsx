'use client'

import React, { useState } from 'react'
import { Download, X, FileText, Database, CheckSquare, Square, ChevronRight, ChevronDown, Globe } from 'lucide-react'
import { Note, Category } from '../types'

interface BatchExportModalProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  categories: Category[]
  isDark?: boolean
}

export default function BatchExportModal({ 
  isOpen, 
  onClose, 
  notes, 
  categories, 
  isDark = false 
}: BatchExportModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'html'>('markdown')
  const [exportType, setExportType] = useState<'all' | 'selected'>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  // 构建分类树结构
  const buildCategoryTree = (parentId?: string): Category[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  // 获取所有分类名称（包括"全部"）
  const allCategoryNames = ['全部', ...categories.map(cat => cat.name)]

  // 切换分类展开状态
  const toggleCategoryExpansion = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  // 切换分类选择
  const toggleCategory = (categoryName: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName)
    } else {
      newSelected.add(categoryName)
    }
    setSelectedCategories(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedCategories.size === allCategoryNames.length) {
      setSelectedCategories(new Set())
    } else {
      setSelectedCategories(new Set(allCategoryNames))
    }
  }

  // 获取要导出的笔记
  const getNotesToExport = () => {
    if (exportType === 'all') {
      return notes
    }
    
    if (selectedCategories.has('全部')) {
      return notes
    }
    
    return notes.filter(note => selectedCategories.has(note.category))
  }

  // 导出为JSON
  const exportAsJSON = () => {
    const notesToExport = getNotesToExport()
    const categoriesToExport = exportType === 'all' ? categories : 
      categories.filter(cat => selectedCategories.has(cat.name))
    
    const data = {
      notes: notesToExport,
      categories: categoriesToExport,
      exportInfo: {
        exportDate: new Date().toISOString(),
        totalNotes: notesToExport.length,
        totalCategories: categoriesToExport.length,
        exportType,
        selectedCategories: Array.from(selectedCategories)
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digital-garden-batch-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onClose()
  }

  // 导出为HTML
  const exportAsHTML = () => {
    const notesToExport = getNotesToExport()
    
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数字花园批量导出</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #f8f9fa;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .export-info {
            color: #666;
            font-size: 14px;
            margin: 10px 0;
        }
        .category-section {
            background: white;
            margin-bottom: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .category-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            font-size: 24px;
            font-weight: bold;
        }
        .note-item {
            border-bottom: 1px solid #eee;
            padding: 25px 30px;
        }
        .note-item:last-child {
            border-bottom: none;
        }
        .note-title {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
        }
        .note-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
            font-size: 14px;
            color: #666;
        }
        .note-tags {
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
        }
        .tag {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
        }
        .note-content {
            margin-top: 15px;
            line-height: 1.8;
        }
        .note-content h1, .note-content h2, .note-content h3 {
            color: #2c3e50;
            margin-top: 25px;
            margin-bottom: 15px;
        }
        .note-content p {
            margin-bottom: 15px;
        }
        .note-content blockquote {
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #666;
        }
        .note-content code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        .note-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .note-content th, .note-content td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .note-content th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .toc {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .toc h2 {
            margin-top: 0;
            color: #2c3e50;
        }
        .toc ul {
            list-style: none;
            padding-left: 0;
        }
        .toc li {
            margin: 8px 0;
        }
        .toc a {
            color: #3498db;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌱 数字花园批量导出</h1>
        <div class="export-info">导出时间: ${new Date().toLocaleString()}</div>
        <div class="export-info">导出类型: ${exportType === 'all' ? '全部笔记' : '选定分类'}</div>
        <div class="export-info">笔记数量: ${notesToExport.length} 篇</div>
        ${exportType === 'selected' && selectedCategories.size > 0 ? 
          `<div class="export-info">选定分类: ${Array.from(selectedCategories).join(', ')}</div>` : ''}
    </div>
    
    <div class="toc">
        <h2>📋 目录</h2>
        <ul>`
    
    // 按分类分组
    const notesByCategory = notesToExport.reduce((acc, note) => {
      if (!acc[note.category]) {
        acc[note.category] = []
      }
      acc[note.category].push(note)
      return acc
    }, {} as Record<string, Note[]>)
    
    // 生成目录
    Object.entries(notesByCategory).forEach(([categoryName, categoryNotes]) => {
      html += `
            <li><a href="#category-${categoryName.replace(/\s+/g, '-')}">${categoryName} (${categoryNotes.length})</a>
                <ul>`
      categoryNotes.forEach(note => {
        html += `<li><a href="#note-${note.id}">${note.title}</a></li>`
      })
      html += `</ul></li>`
    })
    
    html += `
        </ul>
    </div>`
    
    // 生成内容
    Object.entries(notesByCategory).forEach(([categoryName, categoryNotes]) => {
      html += `
    <div class="category-section" id="category-${categoryName.replace(/\s+/g, '-')}">
        <div class="category-header">${categoryName}</div>`
      
      categoryNotes.forEach(note => {
        html += `
        <div class="note-item" id="note-${note.id}">
            <div class="note-title">${note.title}</div>
            <div class="note-meta">
                <span>📅 创建: ${new Date(note.createdAt).toLocaleString()}</span>
                <span>🔄 更新: ${new Date(note.updatedAt).toLocaleString()}</span>
            </div>`
        
        if (note.tags && note.tags.length > 0) {
          html += `
            <div class="note-tags">`
          note.tags.forEach(tag => {
            html += `<span class="tag">${tag}</span>`
          })
          html += `</div>`
        }
        
        html += `
            <div class="note-content">
                ${note.content}
            </div>
        </div>`
      })
      
      html += `
    </div>`
    })
    
    html += `
</body>
</html>`
    
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digital-garden-batch-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onClose()
  }

  // 导出为Markdown
  const exportAsMarkdown = () => {
    const notesToExport = getNotesToExport()
    
    let markdown = '# 数字花园批量导出\n\n'
    markdown += `**导出时间:** ${new Date().toLocaleString()}\n`
    markdown += `**导出类型:** ${exportType === 'all' ? '全部笔记' : '选定分类'}\n`
    markdown += `**笔记数量:** ${notesToExport.length}\n\n`
    
    if (exportType === 'selected' && selectedCategories.size > 0) {
      markdown += `**选定分类:** ${Array.from(selectedCategories).join(', ')}\n\n`
    }
    
    markdown += '---\n\n'
    
    // 按分类分组导出
    const notesByCategory = notesToExport.reduce((acc, note) => {
      if (!acc[note.category]) {
        acc[note.category] = []
      }
      acc[note.category].push(note)
      return acc
    }, {} as Record<string, Note[]>)
    
    Object.entries(notesByCategory).forEach(([categoryName, categoryNotes]) => {
      markdown += `# ${categoryName}\n\n`
      
      categoryNotes.forEach(note => {
        markdown += `## ${note.title}\n\n`
        markdown += `**标签:** ${note.tags?.join(', ') || '无'}\n`
        markdown += `**创建时间:** ${new Date(note.createdAt).toLocaleString()}\n`
        markdown += `**更新时间:** ${new Date(note.updatedAt).toLocaleString()}\n\n`
        
        // 处理笔记内容，移除HTML标签
        const cleanContent = note.content.replace(/<[^>]*>/g, '').trim()
        markdown += `${cleanContent}\n\n`
        markdown += '---\n\n'
      })
    })
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digital-garden-batch-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onClose()
  }

  const handleExport = () => {
    if (exportFormat === 'json') {
      exportAsJSON()
    } else if (exportFormat === 'html') {
      exportAsHTML()
    } else {
      exportAsMarkdown()
    }
  }

  const notesToExport = getNotesToExport()

  // 渲染分类树项
  const renderCategoryItem = (category: Category, level: number = 0) => {
    const categoryNotes = notes.filter(n => n.category === category.name)
    const children = buildCategoryTree(category.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedCategories.has(category.name)
    const isSelected = selectedCategories.has(category.name)

    return (
      <div key={category.id}>
        <label className="flex items-center cursor-pointer py-1">
          <div className="flex items-center" style={{ marginLeft: `${level * 16}px` }}>
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  toggleCategoryExpansion(category.name)
                }}
                className={`mr-1 p-0.5 rounded transition-colors ${
                  isDark ? 'hover:bg-[#3a3a3a]' : 'hover:bg-gray-200'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4 h-4 mr-1" />}
            
            <div className="mr-2" onClick={() => toggleCategory(category.name)}>
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-500" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
            </div>
            
            <span
              onClick={() => toggleCategory(category.name)}
              className={`flex-1 text-sm ${
                isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
              }`}
            >
              {category.name} ({categoryNotes.length})
            </span>
          </div>
        </label>
        
        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-lg shadow-xl ${
        isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
      }`}>
        {/* 标题栏 */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-[#404040]' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${
            isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
          }`}>
            批量导出笔记
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark
                ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#3a3a3a]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-4 space-y-4">
          {/* 导出类型选择 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
            }`}>
              导出范围
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === 'all'}
                  onChange={(e) => setExportType(e.target.value as 'all' | 'selected')}
                  className="mr-2"
                />
                <span className={isDark ? 'text-[#e0e0e0]' : 'text-gray-700'}>
                  全部笔记 ({notes.length} 篇)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="selected"
                  checked={exportType === 'selected'}
                  onChange={(e) => setExportType(e.target.value as 'all' | 'selected')}
                  className="mr-2"
                />
                <span className={isDark ? 'text-[#e0e0e0]' : 'text-gray-700'}>
                  选定分类
                </span>
              </label>
            </div>
          </div>

          {/* 分类选择 */}
          {exportType === 'selected' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${
                  isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
                }`}>
                  选择分类
                </label>
                <button
                  onClick={toggleSelectAll}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    isDark
                      ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#3a3a3a]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {selectedCategories.size === allCategoryNames.length ? '取消全选' : '全选'}
                </button>
              </div>
              <div className={`max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1 ${
                isDark ? 'border-[#404040] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
              }`}>
                {/* 全部选项 */}
                <label className="flex items-center cursor-pointer py-1">
                  <div className="mr-2" onClick={() => toggleCategory('全部')}>
                    {selectedCategories.has('全部') ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <span
                    onClick={() => toggleCategory('全部')}
                    className={`flex-1 text-sm font-medium ${
                      isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
                    }`}
                  >
                    全部 ({notes.length})
                  </span>
                </label>
                
                {/* 分类树 */}
                {buildCategoryTree().map(category => renderCategoryItem(category))}
              </div>
            </div>
          )}

          {/* 导出格式选择 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
            }`}>
              导出格式
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setExportFormat('markdown')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  exportFormat === 'markdown'
                    ? isDark
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-blue-500 border-blue-500 text-white'
                    : isDark
                      ? 'border-[#404040] text-[#e0e0e0] hover:bg-[#3a3a3a]'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm">Markdown</span>
              </button>
              <button
                onClick={() => setExportFormat('html')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  exportFormat === 'html'
                    ? isDark
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-blue-500 border-blue-500 text-white'
                    : isDark
                      ? 'border-[#404040] text-[#e0e0e0] hover:bg-[#3a3a3a]'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">HTML</span>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  exportFormat === 'json'
                    ? isDark
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-blue-500 border-blue-500 text-white'
                    : isDark
                      ? 'border-[#404040] text-[#e0e0e0] hover:bg-[#3a3a3a]'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="text-sm">JSON</span>
              </button>
            </div>
          </div>

          {/* 预览信息 */}
          <div className={`p-3 rounded-lg ${
            isDark ? 'bg-[#1a1a1a] border border-[#404040]' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className={`text-sm ${isDark ? 'text-[#a0a0a0]' : 'text-gray-600'}`}>
              将导出 <span className="font-medium text-blue-500">{notesToExport.length}</span> 篇笔记
              {exportType === 'selected' && selectedCategories.size > 0 && (
                <span>，来自 <span className="font-medium text-blue-500">{selectedCategories.size}</span> 个分类</span>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className={`flex justify-end gap-3 p-4 border-t ${
          isDark ? 'border-[#404040]' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-[#404040] text-[#e0e0e0] hover:bg-[#4a4a4a]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={exportType === 'selected' && selectedCategories.size === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              exportType === 'selected' && selectedCategories.size === 0
                ? isDark
                  ? 'bg-[#404040] text-[#666] cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>
    </div>
  )
}
