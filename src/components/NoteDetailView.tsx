import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, Edit, Save, X, Upload, Bold, Italic, Underline, Highlighter, Code, Link, Quote, StickyNote, Indent, Type, 
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Minus, Code2, BookOpen, ChevronDown, 
  MessageSquare, Brackets, Tag, Calendar, Plus, Image, Table, 
} from 'lucide-react'
import { Note } from '../types'
import BreadcrumbNav from './BreadcrumbNav'
import TagDisplay from './TagDisplay'
import TagSelector from './TagSelector'
import InlineEditor from './InlineEditor'
import ImageUpload from './ImageUpload'
import TableOfContents from './TableOfContents'
import SingleNoteExport from './SingleNoteExport'
import TableConfigModal, { TableConfig } from './TableConfigModal'
import { generateMarkdownTable, insertTableAtPosition } from '../utils/tableGenerator'
import { useKeywordEasterEgg } from '../hooks/useKeywordEasterEgg'
import { checkLongNote, checkNoteWithImage, checkFirstCategory } from '../utils/easterEggTriggers'

interface NoteDetailViewProps {
  note: Note
  isDark: boolean
  onSave: (noteData: Partial<Note>) => void
  onClose?: () => void
  notes?: Note[]
  onNoteSelect?: (note: Note) => void
  fontFamily?: string
  onScrollToAnnotation?: (position: number) => void
  isEditing?: boolean
  onEditingChange?: (editing: boolean) => void
}

export default function NoteDetailView({ note, isDark, onSave, onClose, notes = [], onNoteSelect, fontFamily, onScrollToAnnotation, isEditing: externalIsEditing, onEditingChange }: NoteDetailViewProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false)
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing
  const setIsEditing = onEditingChange || setInternalIsEditing
  const [content, setContent] = useState(note.content)
  const [title, setTitle] = useState(note.title)
  const [selectedTags, setSelectedTags] = useState<string[]>(note.tags || [])
  const [showNumberMenu, setShowNumberMenu] = useState(false)
  const [showH1Menu, setShowH1Menu] = useState(false)
  const [showH2Menu, setShowH2Menu] = useState(false)
  const [showH3Menu, setShowH3Menu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  
  // 当笔记切换时，更新状态
  useEffect(() => {
    setContent(note.content)
    setTitle(note.title)
    setSelectedTags(note.tags || [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]) // 只在笔记ID变化时更新，忽略其他依赖以避免编辑时的状态重置
  
  // 实时检测关键词彩蛋（仅在编辑模式下）
  useKeywordEasterEgg(isEditing ? title : '', isEditing ? content : '')

  // 滚动到备注位置
  const handleScrollToAnnotation = (position: number) => {
    try {
      // 查找包含备注的元素
      const noteContent = document.querySelector('.note-content')
      if (!noteContent) return

      // 查找所有备注元素
      const annotations = noteContent.querySelectorAll('.text-with-note')
      for (const annotation of annotations) {
        const element = annotation as HTMLElement
        // 简单的位置匹配，实际可能需要更精确的定位
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        
        // 高亮显示
        element.style.backgroundColor = isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
        setTimeout(() => {
          element.style.backgroundColor = ''
        }, 2000)
        break // 只滚动到第一个匹配的
      }
    } catch (error) {
      console.warn('滚动到备注位置出错:', error)
    }
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      if (showNumberMenu && !target.closest('.number-menu-container')) {
        setShowNumberMenu(false)
      }
      if (showH1Menu && !target.closest('.h1-menu-container')) {
        setShowH1Menu(false)
      }
      if (showH2Menu && !target.closest('.h2-menu-container')) {
        setShowH2Menu(false)
      }
      if (showH3Menu && !target.closest('.h3-menu-container')) {
        setShowH3Menu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNumberMenu, showH1Menu, showH2Menu, showH3Menu])
  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  
  // 检查内容是否包含标题
  const hasHeadings = () => {
    if (!content) return false
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6')
    return headings.length > 0
  }

  // 当笔记变化时更新状态
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setSelectedTags(note.tags || [])
    setIsEditing(false)
    setShowTagInput(false)
    setNewTag('')
  }, [note.id, note.title, note.content, note.tags, setIsEditing]) // 依赖所有相关属性确保状态同步

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  // 保存笔记
  const handleSave = async () => {
    if (isSaving) return // 防止重复保存
    
    setIsSaving(true)
    try {
      // 如果是模板笔记，确保包含"模板"标签
      const isTemplateNote = note.category === '模板' || note.tags?.includes('模板')
      const finalTags = selectedTags.filter(tag => tag.trim() !== '')
      if (isTemplateNote && !finalTags.includes('模板')) {
        finalTags.push('模板')
      }

      const trimmedContent = content.trim()
      
      onSave({
        title: title.trim(),
        content: trimmedContent,
        category: note.category, // 保留原始分类
        tags: finalTags,
        isPublished: note.isPublished // 保留原始发布状态
      })
      
      // 触发彩蛋检查
      checkLongNote(trimmedContent.length)
      
      // 检查是否包含图片
      if (trimmedContent.includes('![') || trimmedContent.includes('<img')) {
        checkNoteWithImage()
      }
      
      // 检查是否第一次使用分类
      if (note.category && note.category !== '未分类') {
        checkFirstCategory()
      }
      
      setIsEditing(false)
    } finally {
      // 延迟重置保存状态，防止快速重复点击
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()])
      setNewTag('')
      setShowTagInput(false)
    }
  }

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  // 处理图片插入
  const handleImageInsert = (imageData: string) => {
    const editorElement = document.querySelector('.note-content[contenteditable="true"]') as HTMLElement
    if (!editorElement || !isEditing) return

    const selection = window.getSelection()
    if (!selection) return

    // 获取当前光标位置
    let range: Range
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0)
    } else {
      // 如果没有选区，在内容末尾插入
      range = document.createRange()
      range.selectNodeContents(editorElement)
      range.collapse(false)
    }

    // 创建图片元素
    const imgTag = `<div><img src="${imageData}" style="width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" /></div><p><br></p>`
    
    // 在光标位置插入图片
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = imgTag
    const fragment = document.createDocumentFragment()
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    
    range.deleteContents()
    range.insertNode(fragment)
    
    // 将光标移动到图片后面
    try {
      const newRange = document.createRange()
      // 查找刚插入的最后一个元素
      const insertedElements = editorElement.querySelectorAll('img[src^="data:image"]')
      const lastInsertedImg = insertedElements[insertedElements.length - 1]
      
      if (lastInsertedImg && lastInsertedImg.parentElement) {
        // 找到图片容器的下一个兄弟元素（应该是<p><br></p>）
        const nextElement = lastInsertedImg.parentElement.nextElementSibling
        if (nextElement) {
          newRange.setStart(nextElement, 0)
          newRange.collapse(true)
        } else {
          // 如果没有下一个元素，在图片容器后创建新的段落
          const newParagraph = document.createElement('p')
          newParagraph.innerHTML = '<br>'
          lastInsertedImg.parentElement.insertAdjacentElement('afterend', newParagraph)
          newRange.setStart(newParagraph, 0)
          newRange.collapse(true)
        }
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    } catch (e) {
      console.log('光标定位失败，使用默认位置')
      // 如果定位失败，将光标移到编辑器末尾
      const fallbackRange = document.createRange()
      fallbackRange.selectNodeContents(editorElement)
      fallbackRange.collapse(false)
      selection.removeAllRanges()
      selection.addRange(fallbackRange)
    }
    
    // 更新内容状态
    setContent(editorElement.innerHTML)
    setShowImageUpload(false)
  }

  // 中文数字映射
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

  // 处理编号选择
  const handleNumberSelect = (number: number) => {
    // 先关闭菜单
    setShowNumberMenu(false)
    
    // 稍微延迟执行插入，确保编辑器重新获得焦点
    setTimeout(() => {
      const editorElement = document.querySelector('.note-content[contenteditable="true"]') as HTMLElement
      if (!editorElement) return

      // 确保编辑器获得焦点
      editorElement.focus()
      
      const selection = window.getSelection()
      if (!selection) return
      
      // 如果没有选区，创建一个在编辑器末尾的选区
      if (selection.rangeCount === 0) {
        const range = document.createRange()
        range.selectNodeContents(editorElement)
        range.collapse(false)
        selection.addRange(range)
      }

      const range = selection.getRangeAt(0)
      const insertText = `${number}、 `
      
      // 插入编号文本
      range.deleteContents()
      const textNode = document.createTextNode(insertText)
      range.insertNode(textNode)
      
      // 将光标移到插入文本后面
      const newRange = document.createRange()
      newRange.setStartAfter(textNode)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      // 更新内容状态
      setContent(editorElement.innerHTML)
    }, 50)
  }

  // 处理标题选择
  const handleHeadingSelect = (level: number, number: number) => {
    // 关闭对应菜单
    if (level === 1) setShowH1Menu(false)
    if (level === 2) setShowH2Menu(false)
    if (level === 3) setShowH3Menu(false)
    
    setTimeout(() => {
      const editorElement = document.querySelector('.note-content[contenteditable="true"]') as HTMLElement
      if (!editorElement) return

      editorElement.focus()
      
      const selection = window.getSelection()
      if (!selection) return
      
      if (selection.rangeCount === 0) {
        const range = document.createRange()
        range.selectNodeContents(editorElement)
        range.collapse(false)
        selection.addRange(range)
      }

      const range = selection.getRangeAt(0)
      
      // 保存原始光标位置信息
      const originalContainer = range.startContainer
      const originalOffset = range.startOffset
      
      let headingText = ''
      
      // 根据级别设置不同格式
      if (level === 1) {
        headingText = `${chineseNumbers[number - 1]}、`
      } else if (level === 2) {
        headingText = `（${number}）、`
      } else if (level === 3) {
        headingText = `${number}. `
      }
      
      const insertText = `<h${level} class="custom-heading-${level}">${headingText}</h${level}><p><br></p>`
      
      // 插入标题HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = insertText
      
      range.deleteContents()
      const fragment = document.createDocumentFragment()
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild)
      }
      range.insertNode(fragment)
      
      // 为新插入的标题添加ID
      const headingElements = editorElement.querySelectorAll(`h${level}.custom-heading-${level}`)
      const lastHeading = headingElements[headingElements.length - 1] as HTMLElement
      if (lastHeading) {
        const timestamp = Date.now()
        const id = `heading-${timestamp}`
        lastHeading.id = id
      }
      
      // 尝试恢复原始光标位置，如果失败则保持当前位置
      try {
        const newRange = document.createRange()
        if (originalContainer && originalContainer.parentNode && editorElement.contains(originalContainer)) {
          newRange.setStart(originalContainer, originalOffset)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      } catch (e) {
        // 如果恢复失败，保持当前光标位置不变
        console.log('保持当前光标位置')
      }
      
      setContent(editorElement.innerHTML)
    }, 50)
  }

  // 处理格式化内容插入
  const handleFormatContent = (format: string) => {
    if (!isEditing) return
    
    const editorElement = document.querySelector('.note-content[contenteditable="true"]') as HTMLElement
    if (!editorElement) return

    let insertText = ''
    switch (format) {
      case 'h1':
        // 显示H1选择菜单
        setShowH1Menu(true)
        return
      case 'h2':
        // 显示H2选择菜单
        setShowH2Menu(true)
        return
      case 'h3':
        // 显示H3选择菜单
        setShowH3Menu(true)
        return
      case 'divider':
        insertText = '<hr style="border: none; border-top: 2px solid #ccc; margin: 20px 0;"><div><br></div>'
        break
      case 'code':
        insertText = `
          <div class="code-block-container">
            <div class="code-block-header">
              <span>代码片段</span>
              <div class="code-block-actions">
                <select class="language-selector" style="background: transparent; border: 1px solid #ccc; border-radius: 4px; padding: 2px 6px; font-size: 11px; margin-right: 8px;">
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="css">CSS</option>
                  <option value="html">HTML</option>
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="bash">Bash</option>
                  <option value="sql">SQL</option>
                  <option value="plaintext">纯文本</option>
                </select>
                <button class="copy-code-btn" title="复制代码" style="background: transparent; border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer; margin-right: 4px;">📋</button>
                <button class="delete-code-btn" title="删除代码块" style="background: transparent; border: 1px solid #dc3545; color: #dc3545; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer;">🗑️</button>
              </div>
            </div>
            <div class="code-block-content">
              <pre><code class="language-javascript">// 在这里输入你的代码
function example() {
  console.log("Hello, World!");
}</code></pre>
            </div>
          </div>
          <div><br></div>
        `.trim()
        break
      case 'brackets':
        insertText = '<span style="border: 1px solid #ccc; padding: 2px 8px; border-radius: 4px; background: #f5f5f5;">「文本内容」</span>'
        break
      case 'table':
        // 显示表格配置弹窗
        setShowTableModal(true)
        return
    }
    
    // 获取当前光标位置或选区
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      
      // 如果是标题格式，插入到新行
      if (['h1', 'h2', 'h3'].includes(format)) {
        // 创建临时容器
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = insertText
        
        // 插入内容
        range.deleteContents()
        const fragment = document.createDocumentFragment()
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild)
        }
        range.insertNode(fragment)
        
        // 为新插入的标题添加ID并设置光标位置
        const headingElements = editorElement.querySelectorAll('h1.custom-heading-1, h2.custom-heading-2, h3.custom-heading-3')
        const lastHeading = headingElements[headingElements.length - 1] as HTMLElement
        if (lastHeading) {
          // 生成唯一ID
          const timestamp = Date.now()
          const id = `heading-${timestamp}`
          lastHeading.id = id
          
          // 设置光标位置
          const newRange = document.createRange()
          newRange.setStart(lastHeading.firstChild!, 2) // 在"一、"后面
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      } else {
        // 其他格式直接插入
        if (format === 'ul') {
          // 项目符号直接插入文本
          range.deleteContents()
          const textNode = document.createTextNode(insertText)
          range.insertNode(textNode)
          
          // 将光标移到插入文本后面
          const newRange = document.createRange()
          newRange.setStartAfter(textNode)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        } else if (format === 'checkbox') {
          // 复选框特殊处理
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = insertText
          
          range.deleteContents()
          const fragment = document.createDocumentFragment()
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild)
          }
          range.insertNode(fragment)
          
          // 为复选框添加点击事件
          setTimeout(() => {
            const checkboxes = editorElement.querySelectorAll('.todo-checkbox')
            checkboxes.forEach(checkbox => {
              checkbox.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement
                const todoText = target.nextElementSibling as HTMLElement
                if (target.checked) {
                  todoText.style.textDecoration = 'line-through'
                  todoText.style.opacity = '0.6'
                } else {
                  todoText.style.textDecoration = 'none'
                  todoText.style.opacity = '1'
                }
                setContent(editorElement.innerHTML)
              })
            })
            
            // 设置光标在"待办事项"文字后面
            const todoTexts = editorElement.querySelectorAll('.todo-text')
            const lastTodoText = todoTexts[todoTexts.length - 1] as HTMLElement
            if (lastTodoText && lastTodoText.firstChild) {
              const newRange = document.createRange()
              newRange.setStart(lastTodoText.firstChild, lastTodoText.textContent?.length || 0)
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)
            }
          }, 10)
        } else if (format === 'code') {
          // 代码块特殊处理
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = insertText
          
          range.deleteContents()
          const fragment = document.createDocumentFragment()
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild)
          }
          range.insertNode(fragment)
          
          // 为代码块添加功能
          setTimeout(() => {
            const languageSelectors = editorElement.querySelectorAll('.language-selector')
            const copyButtons = editorElement.querySelectorAll('.copy-code-btn')
            const deleteButtons = editorElement.querySelectorAll('.delete-code-btn')
            
            // 语言切换功能
            languageSelectors.forEach(selector => {
              selector.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement
                const codeBlock = target.closest('.code-block-container')?.querySelector('code')
                if (codeBlock) {
                  // 移除旧的语言类
                  codeBlock.className = codeBlock.className.replace(/language-\w+/g, '')
                  // 添加新的语言类
                  codeBlock.classList.add(`language-${target.value}`)
                  
                  // 重新应用语法高亮
                  if (window.hljs) {
                    codeBlock.removeAttribute('data-highlighted')
                    codeBlock.classList.remove('hljs')
                    window.hljs.highlightElement(codeBlock)
                    
                    // 重新应用行号
                    if (window.hljs.lineNumbersBlock) {
                      window.hljs.lineNumbersBlock(codeBlock)
                    }
                  }
                  
                  setContent(editorElement.innerHTML)
                }
              })
            })
            
            // 复制代码功能
            copyButtons.forEach(button => {
              button.addEventListener('click', async (e) => {
                const target = e.target as HTMLButtonElement
                const codeBlock = target.closest('.code-block-container')?.querySelector('code')
                if (codeBlock) {
                  const codeText = codeBlock.textContent || ''
                  try {
                    await navigator.clipboard.writeText(codeText)
                    // 临时改变按钮文本显示复制成功
                    const originalText = target.textContent
                    target.textContent = '✅'
                    target.style.color = '#28a745'
                    setTimeout(() => {
                      target.textContent = originalText
                      target.style.color = ''
                    }, 2000)
                  } catch (err) {
                    console.error('复制失败:', err)
                    // 降级方案：选中文本
                    const selection = window.getSelection()
                    const range = document.createRange()
                    range.selectNodeContents(codeBlock)
                    selection?.removeAllRanges()
                    selection?.addRange(range)
                  }
                }
              })
            })
            
            // 删除代码块功能
            deleteButtons.forEach(button => {
              button.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement
                const codeContainer = target.closest('.code-block-container')
                if (codeContainer && confirm('确定要删除这个代码块吗？')) {
                  // 找到下一个br元素也一起删除
                  const nextElement = codeContainer.nextElementSibling
                  if (nextElement && nextElement.tagName === 'DIV' && nextElement.innerHTML === '<br>') {
                    nextElement.remove()
                  }
                  codeContainer.remove()
                  setContent(editorElement.innerHTML)
                }
              })
            })
            
            // 立即应用语法高亮到新插入的代码块
            const newCodeBlocks = editorElement.querySelectorAll('pre code:not(.hljs)')
            newCodeBlocks.forEach(block => {
              if (window.hljs) {
                window.hljs.highlightElement(block)
                if (window.hljs.lineNumbersBlock) {
                  window.hljs.lineNumbersBlock(block)
                }
              }
            })
            
            // 设置光标在代码内容中
            const codeElements = editorElement.querySelectorAll('pre code')
            const lastCodeElement = codeElements[codeElements.length - 1] as HTMLElement
            if (lastCodeElement) {
              const newRange = document.createRange()
              const textNode = lastCodeElement.firstChild
              if (textNode) {
                newRange.setStart(textNode, 0)
                newRange.collapse(true)
                selection.removeAllRanges()
                selection.addRange(newRange)
              }
            }
          }, 100)
        } else {
          // 其他格式使用HTML插入
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = insertText
          
          range.deleteContents()
          const fragment = document.createDocumentFragment()
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild)
          }
          range.insertNode(fragment)
        }
      }
      
      // 更新内容状态
      setContent(editorElement.innerHTML)
    }
  }

  // 处理表格插入
  const handleTableInsert = (config: TableConfig) => {
    if (!isEditing) return
    
    const editorElement = document.querySelector('.note-content[contenteditable="true"]') as HTMLElement
    if (!editorElement) return

    const selection = window.getSelection()
    if (!selection) return

    // 获取当前光标位置
    let range: Range
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0)
    } else {
      // 如果没有选区，在内容末尾插入
      range = document.createRange()
      range.selectNodeContents(editorElement)
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
    
    tableHTML += '</table><div><br></div>'

    // 插入表格
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = tableHTML
    const fragment = document.createDocumentFragment()
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    
    range.insertNode(fragment)
    
    // 更新内容状态
    setContent(editorElement.innerHTML)
  }

  // 面包屑路径 - 构建完整的层级路径
  const buildBreadcrumbItems = () => {
    const items = [{ label: 'Home', href: '/' }]
    
    // 如果有分类，需要构建完整的分类路径
    if (note.category && note.category !== '未分类') {
      // 从存储中获取所有分类来构建路径
      const categories = JSON.parse(localStorage.getItem('digital-garden-categories') || '[]')
      const findCategoryPath = (categoryName: string): string[] => {
        const category = categories.find((cat: { name: string; id: string; parentId?: string }) => cat.name === categoryName)
        if (!category) return [categoryName]
        
        if (category.parentId) {
          const parentCategory = categories.find((cat: { name: string; id: string; parentId?: string }) => cat.id === category.parentId)
          if (parentCategory) {
            return [...findCategoryPath(parentCategory.name), categoryName]
          }
        }
        return [categoryName]
      }
      
      const categoryPath = findCategoryPath(note.category)
      categoryPath.forEach(catName => {
        items.push({ label: catName, href: `#${catName}` })
      })
    }
    
    items.push({ label: note.title, href: `#${note.id}` })
    return items
  }

  const breadcrumbItems = buildBreadcrumbItems()

  return (
    <div className={`max-w-4xl mx-auto px-6 py-8 ${isDark ? 'text-[#e0e0e0]' : 'text-[#2d3748]'}`}>
        {/* 面包屑导航 */}
        <BreadcrumbNav items={breadcrumbItems} isDark={isDark} />

        {/* 标题区域 */}
        <div className="mb-8">
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full text-4xl font-bold bg-transparent border-none outline-none ${
                isDark ? 'text-[#e0e0e0]' : 'text-[#2d3748]'
              } focus:ring-2 focus:ring-blue-500/20 rounded px-2 py-1`}
              placeholder="笔记标题..."
            />
            <div className="flex items-center gap-2 flex-wrap">
              {/* 基础操作按钮 */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                title={isSaving ? "保存中..." : "保存"}
                className={`p-2 rounded-lg transition-colors ${
                  isSaving
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : isDark
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setTitle(note.title)
                  setContent(note.content)
                  setSelectedTags(note.tags || [])
                }}
                title="取消"
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
              {/* 分隔线 */}
              <div className={`w-px h-6 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
              
              {/* 内容格式化按钮 */}
              <button
                onClick={() => setShowImageUpload(true)}
                title="插入图片"
                className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Image className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFormatContent('table')}
                title="插入表格"
                className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Table className="w-4 h-4" />
              </button>
              <div className="relative h1-menu-container">
                <button
                  onClick={() => handleFormatContent('h1')}
                  title="一级标题"
                  className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Heading1 className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                
                {showH1Menu && (
                  <div className={`absolute top-full left-0 mt-1 p-3 rounded-lg shadow-lg border z-50 min-w-[200px] ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#333] text-[#e0e0e0]' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleHeadingSelect(1, num)}
                          className={`px-3 py-2 text-sm rounded-md hover:bg-opacity-80 transition-colors border ${
                            isDark
                              ? 'hover:bg-[#2a2a2a] border-[#404040] hover:border-blue-500/50'
                              : 'hover:bg-gray-100 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {chineseNumbers[num - 1]}、
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative h2-menu-container">
                <button
                  onClick={() => handleFormatContent('h2')}
                  title="二级标题"
                  className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Heading2 className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                
                {showH2Menu && (
                  <div className={`absolute top-full left-0 mt-1 p-3 rounded-lg shadow-lg border z-50 min-w-[200px] ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#333] text-[#e0e0e0]' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleHeadingSelect(2, num)}
                          className={`px-2 py-2 text-sm rounded-md hover:bg-opacity-80 transition-colors border min-w-[40px] flex items-center justify-center ${
                            isDark
                              ? 'hover:bg-[#2a2a2a] border-[#404040] hover:border-blue-500/50'
                              : 'hover:bg-gray-100 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          （{num}）、
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative h3-menu-container">
                <button
                  onClick={() => handleFormatContent('h3')}
                  title="三级标题"
                  className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Heading3 className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                
                {showH3Menu && (
                  <div className={`absolute top-full left-0 mt-1 p-3 rounded-lg shadow-lg border z-50 min-w-[200px] ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#333] text-[#e0e0e0]' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleHeadingSelect(3, num)}
                          className={`px-3 py-2 text-sm rounded-md hover:bg-opacity-80 transition-colors border ${
                            isDark
                              ? 'hover:bg-[#2a2a2a] border-[#404040] hover:border-blue-500/50'
                              : 'hover:bg-gray-100 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {num}.
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleFormatContent('ul')}
                title="项目符号"
                className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <div className="relative number-menu-container">
                <button
                  onClick={() => handleFormatContent('ol')}
                  title="编号列表"
                  className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ListOrdered className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                
                {showNumberMenu && (
                  <div className={`absolute top-full left-0 mt-1 p-3 rounded-lg shadow-lg border z-50 min-w-[200px] ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#333] text-[#e0e0e0]' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleNumberSelect(num)}
                          className={`px-3 py-2 text-sm rounded-md hover:bg-opacity-80 transition-colors border ${
                            isDark
                              ? 'hover:bg-[#2a2a2a] border-[#404040] hover:border-blue-500/50'
                              : 'hover:bg-gray-100 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {num}、
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleFormatContent('checkbox')}
                title="复选框"
                className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFormatContent('divider')}
                title="分节符"
                className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFormatContent('code')}
                title="代码片段"
                className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFormatContent('brackets')}
                title="「」符号"
                className={`flex items-center px-2 py-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Brackets className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-4">
              <h1 className={`text-4xl font-bold leading-tight ${
                isDark ? 'text-[#e0e0e0]' : 'text-[#2d3748]'
              }`}>
                {note.title}
              </h1>
              <div className="flex items-center gap-2">
                <SingleNoteExport 
                  note={note}
                  isDark={isDark}
                />
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-[#a0a0a0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* 日期 */}
            <div className={`flex items-center gap-2 mb-6 text-sm ${
              isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
            }`}>
              <Calendar className="w-4 h-4" />
              <span>{formatDate(note.createdAt)}</span>
              {note.updatedAt !== note.createdAt && (
                <span>· 更新于 {formatDate(note.updatedAt)}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 标签区域 */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className={`w-4 h-4 ${isDark ? 'text-[#a0a0a0]' : 'text-gray-500'}`} />
          {isEditing ? (
            <>
              {selectedTags.map((tag, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-red-500/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                {showTagInput ? (
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag()
                      if (e.key === 'Escape') setShowTagInput(false)
                    }}
                    onBlur={() => {
                      if (!newTag.trim()) setShowTagInput(false)
                    }}
                    placeholder="添加标签..."
                    className={`px-2 py-1 text-sm rounded border ${
                      isDark
                        ? 'bg-[#2a2a2a] border-[#404040] text-[#e0e0e0]'
                        : 'bg-white border-gray-300 text-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border-2 border-dashed transition-colors ${
                      isDark
                        ? 'border-[#404040] text-[#a0a0a0] hover:border-blue-500/50 hover:text-blue-400'
                        : 'border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                    }`}
                    title="添加新标签"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
                
                {/* 标签云选择按钮 */}
                <button
                  onClick={() => setShowTagSelector(true)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border-2 border-dashed transition-colors ${
                    isDark
                      ? 'border-[#404040] text-[#a0a0a0] hover:border-blue-500/50 hover:text-blue-400'
                      : 'border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                  }`}
                  title="从标签云选择"
                >
                  <Tag className="w-3 h-3" />
                </button>
              </div>
            </>
          ) : (
            <TagDisplay tags={selectedTags} isDark={isDark} size="md" />
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="prose prose-lg max-w-none">
        <InlineEditor
          content={content}
          onChange={setContent}
          isEditing={isEditing}
          isDark={isDark}
          className="min-h-96"
          notes={notes}
          onNoteSelect={onNoteSelect}
          fontFamily={fontFamily}
        />
        
        {!isEditing && !content && (
          <div className={`text-center py-12 ${
            isDark ? 'text-[#666]' : 'text-gray-400'
          }`}>
            <p>这篇笔记还没有内容</p>
            <button
              onClick={() => setIsEditing(true)}
              className={`mt-2 text-sm ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              点击开始编辑
            </button>
          </div>
        )}
      </div>

      {/* 标签选择器 */}
      {showTagSelector && (
        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          onClose={() => setShowTagSelector(false)}
          isDark={isDark}
        />
      )}

      {/* 图片上传组件 */}
      {showImageUpload && (
        <ImageUpload
          isDark={isDark}
          onImageSelect={handleImageInsert}
          onClose={() => setShowImageUpload(false)}
        />
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
