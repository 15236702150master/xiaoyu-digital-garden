import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Bold, Italic, Underline, Highlighter, Code, Link, Quote, Indent, MessageSquare, Type, FileText, Table } from 'lucide-react'
import TableConfigModal, { TableConfig } from './TableConfigModal'
import { Note } from '../types'

interface InlineEditorProps {
  content: string
  onChange: (content: string) => void
  isEditing: boolean
  isDark?: boolean
  className?: string
  notes?: Note[]
  onNoteSelect?: (note: Note) => void
  fontFamily?: string
}

interface FormatButton {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  format: string
}

export default function InlineEditor({ content, onChange, isEditing, isDark = false, className = '', notes = [], onNoteSelect, fontFamily }: InlineEditorProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [selectedRange, setSelectedRange] = useState<Range | null>(null)
  const [showNoteSearch, setShowNoteSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [selectedNoteRange, setSelectedNoteRange] = useState<Range | null>(null)
  const [showTableModal, setShowTableModal] = useState(false)
  const [linkContextMenu, setLinkContextMenu] = useState<{ x: number; y: number; link: HTMLAnchorElement } | null>(null)

  // 格式化按钮配置
  const formatButtons: FormatButton[] = [
    { id: 'bold', icon: Bold, label: '加粗', format: 'bold' },
    { id: 'italic', icon: Italic, label: '斜体', format: 'italic' },
    { id: 'underline', icon: Underline, label: '下划线', format: 'underline' },
    { id: 'highlight', icon: Highlighter, label: '高亮', format: 'highlight' },
    { id: 'code', icon: Code, label: '代码', format: 'code' },
    { id: 'link', icon: Link, label: '链接', format: 'link' },
    { id: 'quote', icon: Quote, label: '引用', format: 'quote' },
    { id: 'note', icon: MessageSquare, label: '备注', format: 'note' },
    { id: 'notelink', icon: FileText, label: '笔记链接', format: 'notelink' },
    { id: 'indent', icon: Indent, label: '缩进', format: 'indent' },
  ]

  // 处理选择变化
  const handleSelection = useCallback(() => {
    if (!isEditing || !contentRef.current) return

    // 添加小延迟确保选择完成
    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setShowToolbar(false)
        return
      }

      const range = selection.getRangeAt(0)
      const selectedText = range.toString().trim()

      if (!selectedText || selectedText.length < 1) {
        setShowToolbar(false)
        return
      }

      // 计算工具栏位置 - 相对于编辑器内容区域
      const rect = range.getBoundingClientRect()
      const containerRect = contentRef.current!.getBoundingClientRect()
      
      // 获取编辑器内容的实际可用区域（考虑padding和安全边距）
      const contentPadding = 16 // 编辑器的padding
      const safeMargin = 20 // 额外的安全边距，防止被左右面板覆盖
      
      const availableLeft = containerRect.left + contentPadding + safeMargin
      const availableRight = containerRect.right - contentPadding - safeMargin
      const availableWidth = availableRight - availableLeft
      
      // 选中文字相对于可用区域的位置
      const selectionCenter = rect.left + (rect.width / 2)
      const relativeCenter = selectionCenter - containerRect.left
      
      // 估算工具栏宽度
      const estimatedToolbarWidth = formatButtons.length * 40 + 120
      const halfToolbarWidth = estimatedToolbarWidth / 2
      
      // 计算工具栏的理想位置（相对于容器）
      let finalLeft = relativeCenter
      
      // 确保工具栏完全在安全区域内
      const minLeft = contentPadding + safeMargin + halfToolbarWidth
      const maxLeft = containerRect.width - contentPadding - safeMargin - halfToolbarWidth
      
      finalLeft = Math.max(minLeft, Math.min(maxLeft, finalLeft))
      
      // 垂直位置：优先显示在选中文字上方
      const idealTop = rect.top - containerRect.top - 60
      let finalTop = idealTop
      
      // 如果上方空间不够，显示在下方
      if (idealTop < 10) {
        finalTop = rect.bottom - containerRect.top + 10
      }
      
      setToolbarPosition({
        top: finalTop,
        left: finalLeft
      })
      
      setShowToolbar(true)
    }, 10) // 10ms延迟确保选择状态稳定
  }, [isEditing, formatButtons.length])

  // 处理表格插入
  const handleTableInsert = (config: TableConfig) => {
    if (!contentRef.current) return

    const selection = window.getSelection()
    if (!selection) return

    // 获取当前光标位置
    let range: Range
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0)
    } else {
      // 如果没有选区，在内容末尾插入
      range = document.createRange()
      range.selectNodeContents(contentRef.current)
      range.collapse(false)
    }

    // 生成HTML表格
    const { rows, cols, hasHeader, theme } = config
    
    // 主题颜色配置
    const themeColors = {
      default: { header: '#f5f5f5', cell: '#ffffff', border: '#ddd' },
      blue: { header: '#e3f2fd', cell: '#f3f9ff', border: '#90caf9' },
      green: { header: '#e8f5e8', cell: '#f1f8f1', border: '#81c784' },
      yellow: { header: '#fff8e1', cell: '#fffef7', border: '#ffb74d' },
      gray: { header: '#f5f5f5', cell: '#fafafa', border: '#bdbdbd' }
    }
    
    const colors = themeColors[theme as keyof typeof themeColors] || themeColors.default
    
    let tableHTML = `<table style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid ${colors.border};">`
    
    if (hasHeader) {
      tableHTML += '<thead><tr>'
      for (let j = 0; j < cols; j++) {
        tableHTML += `<th style="border: 1px solid ${colors.border}; padding: 8px; background-color: ${colors.header}; font-weight: bold;">列${j + 1}</th>`
      }
      tableHTML += '</tr></thead>'
      
      tableHTML += '<tbody>'
      for (let i = 0; i < rows - 1; i++) {
        tableHTML += '<tr>'
        for (let j = 0; j < cols; j++) {
          tableHTML += `<td style="border: 1px solid ${colors.border}; padding: 8px; background-color: ${colors.cell};">内容</td>`
        }
        tableHTML += '</tr>'
      }
      tableHTML += '</tbody>'
    } else {
      tableHTML += '<tbody>'
      for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>'
        for (let j = 0; j < cols; j++) {
          tableHTML += `<td style="border: 1px solid ${colors.border}; padding: 8px; background-color: ${colors.cell};">内容</td>`
        }
        tableHTML += '</tr>'
      }
      tableHTML += '</tbody>'
    }
    
    tableHTML += '</table>'

    // 插入表格
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = tableHTML
    const fragment = document.createDocumentFragment()
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    
    range.insertNode(fragment)
    
    // 触发内容变化
    handleContentChange()
  }

  // 应用格式
  const applyFormat = (format: string) => {
    if (!contentRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (!selectedText) return

    let formattedContent = ''
    switch (format) {
      case 'bold':
        formattedContent = `<strong style="color: #000 !important; font-weight: bold;">${selectedText}</strong>`
        break
      case 'italic':
        formattedContent = `<em>${selectedText}</em>`
        break
      case 'underline':
        formattedContent = `<u>${selectedText}</u>`
        break
      case 'highlight':
        formattedContent = `<mark style="background-color: yellow; padding: 2px 4px;">${selectedText}</mark>`
        break
      case 'code':
        formattedContent = `<code style="background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace;">${selectedText}</code>`
        break
      case 'link':
        const url = prompt('请输入链接地址:')
        if (url) {
          formattedContent = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${selectedText}</a>`
        } else {
          return
        }
        break
      case 'quote':
        formattedContent = `<blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0; font-style: italic; color: #666;">${selectedText}</blockquote>`
        break
      case 'table':
        // 显示表格配置弹窗
        setShowTableModal(true)
        setShowToolbar(false)
        return
      case 'note':
        // 保存选区，显示备注输入框
        setSelectedRange(range.cloneRange())
        setShowNoteInput(true)
        setShowToolbar(false)
        return
      case 'notelink':
        // 保存选区，显示笔记搜索框
        setSelectedNoteRange(range.cloneRange())
        setShowNoteSearch(true)
        setShowToolbar(false)
        return
      case 'indent':
        formattedContent = `<div style="margin-left: 24px;">${selectedText}</div>`
        break
      case 'normal':
        formattedContent = `<span class="normal-text">${selectedText}</span>`
        break
      default:
        return
    }

    // 替换选中的文本
    range.deleteContents()
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = formattedContent
    const fragment = document.createDocumentFragment()
    let lastNode: Node | null = null
    while (tempDiv.firstChild) {
      lastNode = tempDiv.firstChild
      fragment.appendChild(lastNode)
    }
    range.insertNode(fragment)

    // 将光标移到插入内容的末尾，并添加空格隔断格式
    if (lastNode) {
      // 添加一个空格来隔断格式继承
      const spaceNode = document.createTextNode(' ')
      lastNode.parentNode?.insertBefore(spaceNode, lastNode.nextSibling)
      
      const newRange = document.createRange()
      newRange.setStartAfter(spaceNode)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
    
    // 触发内容变化
    handleContentChange()
  }

  // 处理备注确认
  const handleNoteConfirm = () => {
    if (!selectedRange || !noteText.trim()) return

    const selectedText = selectedRange.toString()
    const noteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 创建带备注的HTML，确保备注文本正确编码
    const escapedNoteText = noteText.trim().replace(/"/g, '&quot;').replace(/&/g, '&amp;')
    const formattedContent = `<span class="text-with-note" data-note-id="${noteId}" data-note-text="${escapedNoteText}" style="text-decoration: underline; text-decoration-style: wavy; text-decoration-color: #3b82f6; cursor: help;">${selectedText}</span>`
    
    // 替换选中的文本
    selectedRange.deleteContents()
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = formattedContent
    const fragment = document.createDocumentFragment()
    let lastNode: Node | null = null
    while (tempDiv.firstChild) {
      lastNode = tempDiv.firstChild
      fragment.appendChild(lastNode)
    }
    selectedRange.insertNode(fragment)

    // 将光标移到插入内容的末尾，并添加空格隔断格式
    if (lastNode) {
      const selection = window.getSelection()
      if (selection) {
        // 添加一个空格来隔断格式继承
        const spaceNode = document.createTextNode(' ')
        lastNode.parentNode?.insertBefore(spaceNode, lastNode.nextSibling)
        
        const newRange = document.createRange()
        newRange.setStartAfter(spaceNode)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }

    // 重置状态
    setShowNoteInput(false)
    setNoteText('')
    setSelectedRange(null)
    
    // 触发内容变化
    handleContentChange()
  }

  // 取消备注
  const handleNoteCancel = () => {
    setShowNoteInput(false)
    setNoteText('')
    setSelectedRange(null)
  }

  // 处理笔记搜索
  const handleNoteSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredNotes([])
      return
    }
    
    const filtered = notes.filter(note => 
      note.title.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredNotes(filtered)
  }

  // 处理笔记选择
  const handleNoteSelect = (note: Note) => {
    if (!selectedNoteRange) return

    const selectedText = selectedNoteRange.toString()
    const linkText = selectedText || note.title
    
    // 创建笔记链接HTML
    const formattedContent = `<a href="#" class="note-link" data-note-id="${note.id}" data-note-title="${note.title}" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">${linkText}</a>`
    
    // 替换选中的文本
    selectedNoteRange.deleteContents()
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = formattedContent
    const fragment = document.createDocumentFragment()
    let lastNode: Node | null = null
    while (tempDiv.firstChild) {
      lastNode = tempDiv.firstChild
      fragment.appendChild(lastNode)
    }
    selectedNoteRange.insertNode(fragment)

    // 将光标移到插入内容的末尾
    if (lastNode) {
      const selection = window.getSelection()
      if (selection) {
        const spaceNode = document.createTextNode(' ')
        lastNode.parentNode?.insertBefore(spaceNode, lastNode.nextSibling)
        
        const newRange = document.createRange()
        newRange.setStartAfter(spaceNode)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }

    // 重置状态
    setShowNoteSearch(false)
    setSearchQuery('')
    setFilteredNotes([])
    setSelectedNoteRange(null)
    
    // 触发内容变化
    handleContentChange()
  }

  // 取消笔记搜索
  const handleNoteSearchCancel = () => {
    setShowNoteSearch(false)
    setSearchQuery('')
    setFilteredNotes([])
    setSelectedNoteRange(null)
  }

  // 处理内容变化
  const handleContentChange = () => {
    if (!isEditing || !contentRef.current) return
    
    const newContent = contentRef.current.innerHTML
    onChange(newContent)
  }

  // 处理编辑模式切换和内容更新
  useEffect(() => {
    if (!contentRef.current) return

    if (isEditing && content !== contentRef.current.innerHTML) {
      contentRef.current.innerHTML = content || '<p>这篇笔记还没有内容</p>'
    }
    
    if (!isEditing && content !== contentRef.current.innerHTML) {
      contentRef.current.innerHTML = content || '<p>这篇笔记还没有内容</p>'
    }
  }, [isEditing, content])

  // 处理复选框切换
  const handleCheckboxToggle = useCallback((event: MouseEvent) => {
    if (!isEditing || !contentRef.current) return

    const target = event.target as HTMLElement
    if (!target) return

    // 获取点击位置的文本内容
    const selection = window.getSelection()
    if (!selection) return

    // 获取点击位置的文本节点
    const range = document.caretRangeFromPoint(event.clientX, event.clientY)
    if (!range) return

    const textNode = range.startContainer
    if (textNode.nodeType !== Node.TEXT_NODE) return

    const text = textNode.textContent || ''
    const offset = range.startOffset

    // 检查点击位置附近是否有复选框符号
    const checkboxUnchecked = '☐'
    const checkboxChecked = '☑'
    
    // 查找复选框符号的位置
    let checkboxIndex = -1
    let isChecked = false
    
    // 检查点击位置前后的字符
    for (let i = Math.max(0, offset - 2); i <= Math.min(text.length - 1, offset + 2); i++) {
      if (text[i] === checkboxUnchecked) {
        checkboxIndex = i
        isChecked = false
        break
      } else if (text[i] === checkboxChecked) {
        checkboxIndex = i
        isChecked = true
        break
      }
    }

    if (checkboxIndex === -1) return

    // 切换复选框状态
    const newChar = isChecked ? checkboxUnchecked : checkboxChecked
    const newText = text.substring(0, checkboxIndex) + newChar + text.substring(checkboxIndex + 1)
    
    // 更新文本节点
    textNode.textContent = newText
    
    // 保持光标位置
    const newRange = document.createRange()
    newRange.setStart(textNode, offset)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)
    
    // 触发内容变化
    handleContentChange()
    
    // 阻止默认行为
    event.preventDefault()
    event.stopPropagation()
  }, [isEditing, handleContentChange])

  // 安全的链接点击处理
  const handleLinkClick = useCallback((event: MouseEvent) => {
    try {
      const target = event.target as HTMLElement
      if (!target) return

      // 检查是否点击了笔记链接元素
      if (target.classList.contains('note-link')) {
        if (isEditing || !onNoteSelect || !notes) return
        event.preventDefault()
        event.stopPropagation()

        const noteId = target.getAttribute('data-note-id')
        if (noteId) {
          const note = notes.find(n => n.id === noteId)
          if (note && onNoteSelect) {
            onNoteSelect(note)
          }
        }
      }
      // 处理普通链接点击（在新标签页打开）
      else if (target.tagName === 'A') {
        const link = target as HTMLAnchorElement
        if (link.href && !link.href.startsWith('#')) {
          event.preventDefault()
          window.open(link.href, '_blank', 'noopener,noreferrer')
        }
      }
    } catch (error) {
      console.error('处理链接点击时出错:', error)
    }
  }, [isEditing, onNoteSelect, notes])

  // 处理链接双击编辑
  const handleLinkDoubleClick = useCallback((event: MouseEvent) => {
    if (!isEditing) return
    
    const target = event.target as HTMLElement
    if (target.tagName === 'A' && !target.classList.contains('note-link')) {
      event.preventDefault()
      event.stopPropagation()
      setLinkContextMenu({
        x: event.clientX,
        y: event.clientY,
        link: target as HTMLAnchorElement
      })
    }
  }, [isEditing])

  // 编辑链接
  const handleEditLink = useCallback(() => {
    if (!linkContextMenu) return
    
    const link = linkContextMenu.link
    const newUrl = prompt('请输入新的链接地址:', link.href)
    
    if (newUrl && newUrl !== link.href) {
      link.href = newUrl
      if (contentRef.current) {
        onChange(contentRef.current.innerHTML)
      }
    }
    
    setLinkContextMenu(null)
  }, [linkContextMenu, onChange])

  // 取消链接
  const handleRemoveLink = useCallback(() => {
    if (!linkContextMenu) return
    
    const link = linkContextMenu.link
    const textNode = document.createTextNode(link.textContent || '')
    link.parentNode?.replaceChild(textNode, link)
    
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML)
    }
    
    setLinkContextMenu(null)
  }, [linkContextMenu, onChange])

  // 监听选择变化和链接点击
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setShowToolbar(false)
      }
    }

    // 处理备注悬浮显示
    const handleAnnotationHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target && target.classList.contains('text-with-note')) {
        const noteText = target.getAttribute('data-note-text')
        if (noteText) {
          const decodedText = noteText.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
          target.title = decodedText
        }
      }
    }

    // 全局选择监听器
    const handleGlobalSelection = () => {
      if (isEditing && contentRef.current && document.activeElement === contentRef.current) {
        handleSelection()
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('click', handleLinkClick)
    document.addEventListener('click', handleCheckboxToggle)
    document.addEventListener('dblclick', handleLinkDoubleClick)
    document.addEventListener('mouseover', handleAnnotationHover)
    document.addEventListener('selectionchange', handleGlobalSelection)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('click', handleLinkClick)
      document.removeEventListener('click', handleCheckboxToggle)
      document.removeEventListener('dblclick', handleLinkDoubleClick)
      document.removeEventListener('mouseover', handleAnnotationHover)
      document.removeEventListener('selectionchange', handleGlobalSelection)
    }
  }, [handleLinkClick, handleCheckboxToggle, handleLinkDoubleClick, handleSelection, isEditing])

  return (
    <div className={`relative ${className}`}>
      {/* 内容区域 */}
      {!isEditing ? (
        <div
          ref={contentRef}
          className={`
            note-content w-full min-h-[200px] p-4 rounded-lg transition-colors resize-none bg-transparent
            ${isDark ? 'text-[#e0e0e0]' : ''}
            ${className}
          `}
          style={{
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            fontFamily
          }}
          dangerouslySetInnerHTML={{
            __html: content || '<p>这篇笔记还没有内容</p>'
          }}
        />
      ) : (
        <div
          ref={contentRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
          onMouseDown={() => {
            // 鼠标按下时隐藏工具栏，等待新的选择
            setTimeout(() => setShowToolbar(false), 10)
          }}
          className={`
            note-content w-full min-h-[200px] p-4 rounded-lg transition-colors resize-none bg-transparent placeholder-gray-500
            ${isDark ? 'text-[#e0e0e0] placeholder-[#a0a0a0]' : ''}
            focus:outline-none
            ${className}
          `}
          style={{
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            fontFamily
          }}
        />
      )}

      {/* 格式化工具栏 - 在选中文字附近显示 */}
      {showToolbar && (
        <div
          ref={toolbarRef}
          className={`absolute z-50 flex items-center gap-1 px-3 py-2 rounded-lg shadow-lg border ${
            isDark
              ? 'bg-[#2a2a2a] border-[#404040]'
              : 'bg-white border-gray-200'
          }`}
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <span className={`text-xs mr-2 ${isDark ? 'text-[#a0a0a0]' : 'text-gray-500'}`}>
            已选择: "{window.getSelection()?.toString().substring(0, 20)}{(window.getSelection()?.toString().length || 0) > 20 ? '...' : ''}"
          </span>
          {formatButtons.map((button, index) => (
            <div key={index} className="relative group">
              <button
                onClick={() => applyFormat(button.format)}
                className={`p-2 rounded transition-colors ${
                  isDark
                    ? 'hover:bg-[#404040] text-[#e0e0e0]'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={button.label}
              >
                <button.icon className="w-4 h-4" />
              </button>
              
              {/* 工具提示 */}
              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                isDark
                  ? 'bg-[#404040] text-[#e0e0e0]'
                  : 'bg-gray-800 text-white'
              }`}>
                {button.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 备注输入框 */}
      {showNoteInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
            isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
            }`}>
              添加备注
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="请输入备注内容..."
              className={`w-full h-24 p-3 border rounded-lg resize-none ${
                isDark 
                  ? 'bg-[#1a1a1a] border-[#404040] text-[#e0e0e0] placeholder-[#a0a0a0]' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleNoteCancel}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-[#404040] text-[#e0e0e0] hover:bg-[#4a4a4a]'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleNoteConfirm}
                disabled={!noteText.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  noteText.trim()
                    ? isDark
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    : isDark
                      ? 'bg-[#404040] text-[#666] cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 笔记搜索框 */}
      {showNoteSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
            isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
            }`}>
              选择笔记链接
            </h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleNoteSearch(e.target.value)}
              placeholder="搜索笔记标题..."
              className={`w-full p-3 border rounded-lg ${
                isDark 
                  ? 'bg-[#1a1a1a] border-[#404040] text-[#e0e0e0] placeholder-[#a0a0a0]' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              autoFocus
            />
            
            {/* 搜索结果 */}
            {filteredNotes.length > 0 && (
              <div className={`mt-4 max-h-60 overflow-y-auto border rounded-lg ${
                isDark ? 'border-[#404040]' : 'border-gray-200'
              }`}>
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleNoteSelect(note)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isDark
                        ? 'hover:bg-[#3a3a3a] border-b border-[#404040]'
                        : 'hover:bg-gray-50 border-b border-gray-100'
                    } last:border-b-0`}
                  >
                    <div className={`font-medium ${
                      isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
                    }`}>
                      {note.title}
                    </div>
                    <div className={`text-sm mt-1 ${
                      isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
                    }`}>
                      {note.category}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {searchQuery && filteredNotes.length === 0 && (
              <div className={`mt-4 text-center py-4 ${
                isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
              }`}>
                未找到匹配的笔记
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleNoteSearchCancel}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-[#404040] text-[#e0e0e0] hover:bg-[#4a4a4a]'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 链接编辑菜单（双击触发） */}
      {linkContextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setLinkContextMenu(null)}
          />
          <div
            className={`fixed z-50 min-w-[140px] rounded-lg shadow-lg border ${
              isDark
                ? 'bg-[#2a2a2a] border-[#404040]'
                : 'bg-white border-gray-200'
            }`}
            style={{
              left: `${linkContextMenu.x}px`,
              top: `${linkContextMenu.y}px`
            }}
          >
            <div className={`px-3 py-2 text-xs border-b ${
              isDark
                ? 'text-[#a0a0a0] border-[#404040]'
                : 'text-gray-500 border-gray-200'
            }`}>
              链接操作
            </div>
            <button
              onClick={handleEditLink}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                isDark
                  ? 'text-[#e0e0e0] hover:bg-[#3a3a3a]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              ✏️ 编辑链接
            </button>
            <button
              onClick={handleRemoveLink}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                isDark
                  ? 'text-[#e0e0e0] hover:bg-[#3a3a3a]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🗑️ 取消链接
            </button>
          </div>
        </>
      )}

      {/* 表格配置弹窗 */}
      <TableConfigModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onConfirm={handleTableInsert}
        isDark={isDark}
      />
    </div>
  )
}
