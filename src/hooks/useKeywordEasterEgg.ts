import { useEffect, useRef } from 'react'
import { checkKeywordEasterEgg } from '../utils/easterEggTriggers'

// 关键词列表（按长度排序，优先匹配长词）
const KEYWORDS = ['旅游', '旅行', '失眠', '加班', '考试', '减肥', '生日', '摆烂', '开心', 'emo']

// 防抖延迟（毫秒）
const DEBOUNCE_DELAY = 1000

/**
 * 检查文本中是否包含完整的关键词
 * 确保关键词是独立的词，而不是其他词的一部分
 */
function containsCompleteKeyword(text: string, keyword: string): boolean {
  // 转换为小写进行匹配
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  
  // 查找关键词的所有出现位置
  let index = lowerText.indexOf(lowerKeyword)
  
  while (index !== -1) {
    const before = index > 0 ? lowerText[index - 1] : ' '
    const after = index + lowerKeyword.length < lowerText.length 
      ? lowerText[index + lowerKeyword.length] 
      : ' '
    
    // 检查前后是否是中文字符或字母
    const isChineseBefore = /[\u4e00-\u9fa5]/.test(before)
    const isChineseAfter = /[\u4e00-\u9fa5]/.test(after)
    const isLetterBefore = /[a-zA-Z]/.test(before)
    const isLetterAfter = /[a-zA-Z]/.test(after)
    
    // 对于中文关键词，前后不能是中文字符
    // 对于英文关键词，前后不能是字母
    if ((/[\u4e00-\u9fa5]/.test(lowerKeyword))) {
      // 中文关键词
      if (!isChineseBefore && !isChineseAfter) {
        return true
      }
    } else {
      // 英文关键词
      if (!isLetterBefore && !isLetterAfter) {
        return true
      }
    }
    
    // 继续查找下一个出现位置
    index = lowerText.indexOf(lowerKeyword, index + 1)
  }
  
  return false
}

/**
 * 实时监听输入内容，检测关键词并触发彩蛋
 */
export function useKeywordEasterEgg(title: string, content: string) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastCheckedRef = useRef<string>('')

  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 合并标题和内容
    const text = title + ' ' + content
    
    // 如果内容没有变化，不检测
    if (text === lastCheckedRef.current) {
      return
    }

    // 防抖：延迟检测，避免频繁触发
    timeoutRef.current = setTimeout(() => {
      // 检查是否包含完整的关键词
      const hasKeyword = KEYWORDS.some(keyword => containsCompleteKeyword(text, keyword))
      
      if (hasKeyword && text !== lastCheckedRef.current) {
        // 触发关键词检测
        checkKeywordEasterEgg(title, content)
        lastCheckedRef.current = text
      }
    }, DEBOUNCE_DELAY)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [title, content])
}
