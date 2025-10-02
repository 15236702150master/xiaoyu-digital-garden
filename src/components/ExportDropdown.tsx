'use client'

import { Download } from 'lucide-react'
import { Note, Category } from '../types'
import { checkFirstExport } from '../utils/easterEggTriggers'

interface ExportDropdownProps {
  notes: Note[]
  categories: Category[]
  isDark: boolean
}

export default function ExportDropdown({ notes, categories, isDark }: ExportDropdownProps) {
  const exportAsJSON = () => {
    checkFirstExport() // 触发第一次导出彩蛋
    
    const data = { notes, categories }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digital-garden-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsMarkdown = () => {
    checkFirstExport() // 触发第一次导出彩蛋
    
    let markdown = '# 数字花园导出\n\n'
    notes.forEach(note => {
      markdown += `## ${note.title}\n\n`
      markdown += `**分类:** ${note.category}\n`
      markdown += `**标签:** ${note.tags?.join(', ') || '无'}\n`
      markdown += `**创建时间:** ${new Date(note.createdAt).toLocaleDateString()}\n\n`
      markdown += `${note.content}\n\n---\n\n`
    })
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digital-garden-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative group">
      <button className="p-2 rounded-lg transition-colors bg-white text-[#52575b] hover:bg-gray-50">
        <Download className="w-5 h-5" />
      </button>
      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-2">
          <div className="text-sm font-medium mb-2">导出数据</div>
          <button
            onClick={exportAsJSON}
            className="block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100"
          >
            导出为 JSON
          </button>
          <button
            onClick={exportAsMarkdown}
            className="block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100"
          >
            导出为 Markdown
          </button>
        </div>
      </div>
    </div>
  )
}
