import React, { useState } from 'react'
import { Download, FileText, Image, Copy, Check } from 'lucide-react'
import { Note } from '../types'

interface SingleNoteExportProps {
  note: Note
  isDark: boolean
}

export default function SingleNoteExport({ note, isDark }: SingleNoteExportProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  // 导出为Markdown
  const exportAsMarkdown = () => {
    const markdownContent = `# ${note.title}

**分类：** ${note.category}
**标签：** ${note.tags.join(', ')}
**创建时间：** ${new Date(note.createdAt).toLocaleString()}
**更新时间：** ${new Date(note.updatedAt).toLocaleString()}

---

${note.content}
`

    const blob = new Blob([markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // 导出为HTML
  const exportAsHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${note.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .meta {
            color: #666;
            font-size: 14px;
            margin: 10px 0;
        }
        .tags {
            margin: 10px 0;
        }
        .tag {
            display: inline-block;
            background: #f0f0f0;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin-right: 5px;
        }
        .content {
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${note.title}</h1>
        <div class="meta">分类：${note.category}</div>
        <div class="tags">
            标签：${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="meta">创建时间：${new Date(note.createdAt).toLocaleString()}</div>
        <div class="meta">更新时间：${new Date(note.updatedAt).toLocaleString()}</div>
    </div>
    <div class="content">
        ${note.content}
    </div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // 复制到剪贴板
  const copyToClipboard = async () => {
    const textContent = `${note.title}

分类：${note.category}
标签：${note.tags.join(', ')}
创建时间：${new Date(note.createdAt).toLocaleString()}
更新时间：${new Date(note.updatedAt).toLocaleString()}

${note.content.replace(/<[^>]*>/g, '')}`

    try {
      await navigator.clipboard.writeText(textContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setShowExportMenu(false)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        className={`flex items-center p-2 rounded-lg transition-colors ${
          isDark
            ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }`}
        title="导出笔记"
      >
        <Download className="w-4 h-4" />
      </button>

      {showExportMenu && (
        <div className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${
          isDark 
            ? 'bg-[#1a1a1a] border-[#333] text-[#e0e0e0]' 
            : 'bg-white border-gray-200 text-gray-700'
        }`}>
          <div className="py-2">
            <button
              onClick={exportAsMarkdown}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isDark
                  ? 'hover:bg-[#2a2a2a] text-[#e0e0e0]'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              导出为 Markdown
            </button>
            
            <button
              onClick={exportAsHTML}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isDark
                  ? 'hover:bg-[#2a2a2a] text-[#e0e0e0]'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Image className="w-4 h-4" />
              导出为 HTML
            </button>
            
            <button
              onClick={copyToClipboard}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isDark
                  ? 'hover:bg-[#2a2a2a] text-[#e0e0e0]'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制到剪贴板
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 点击外部关闭菜单 */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  )
}
