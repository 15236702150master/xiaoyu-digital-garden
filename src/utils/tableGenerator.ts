import { TableConfig } from '../components/TableConfigModal'

/**
 * 生成Markdown表格
 */
export function generateMarkdownTable(config: TableConfig): string {
  const { rows, cols, hasHeader } = config
  
  let markdown = ''
  
  // 生成表头
  if (hasHeader) {
    // 表头行
    const headerRow = Array.from({ length: cols }, (_, i) => `列${i + 1}`).join(' | ')
    markdown += `| ${headerRow} |\n`
    
    // 分隔行
    const separatorRow = Array.from({ length: cols }, () => '-----').join(' | ')
    markdown += `| ${separatorRow} |\n`
    
    // 数据行
    const dataRows = rows - 1
    for (let i = 0; i < dataRows; i++) {
      const dataRow = Array.from({ length: cols }, () => '内容').join(' | ')
      markdown += `| ${dataRow} |\n`
    }
  } else {
    // 没有表头，全部是数据行
    for (let i = 0; i < rows; i++) {
      const dataRow = Array.from({ length: cols }, () => '内容').join(' | ')
      markdown += `| ${dataRow} |\n`
      
      // 第一行后添加分隔行
      if (i === 0) {
        const separatorRow = Array.from({ length: cols }, () => '-----').join(' | ')
        markdown += `| ${separatorRow} |\n`
      }
    }
  }
  
  return markdown
}

/**
 * 生成带样式的HTML表格（用于预览）
 */
export function generateStyledTable(config: TableConfig): string {
  const { rows, cols, hasHeader, theme } = config
  
  const themeStyles = {
    default: 'border-gray-300',
    blue: 'border-blue-300 bg-blue-50',
    green: 'border-green-300 bg-green-50',
    yellow: 'border-yellow-300 bg-yellow-50',
    gray: 'border-gray-400 bg-gray-100'
  }
  
  const themeClass = themeStyles[theme as keyof typeof themeStyles] || themeStyles.default
  
  let html = `<table class="w-full border-collapse ${themeClass}">`
  
  // 生成表头
  if (hasHeader) {
    html += '<thead>'
    html += '<tr>'
    for (let j = 0; j < cols; j++) {
      html += `<th class="border p-2 font-medium bg-gray-100">列${j + 1}</th>`
    }
    html += '</tr>'
    html += '</thead>'
    
    // 数据行
    html += '<tbody>'
    for (let i = 0; i < rows - 1; i++) {
      html += '<tr>'
      for (let j = 0; j < cols; j++) {
        html += '<td class="border p-2">内容</td>'
      }
      html += '</tr>'
    }
    html += '</tbody>'
  } else {
    // 没有表头
    html += '<tbody>'
    for (let i = 0; i < rows; i++) {
      html += '<tr>'
      for (let j = 0; j < cols; j++) {
        html += '<td class="border p-2">内容</td>'
      }
      html += '</tr>'
    }
    html += '</tbody>'
  }
  
  html += '</table>'
  
  return html
}

/**
 * 在指定位置插入表格到文本中
 */
export function insertTableAtPosition(
  text: string, 
  position: number, 
  tableMarkdown: string
): { newText: string; newPosition: number } {
  const beforeText = text.substring(0, position)
  const afterText = text.substring(position)
  
  // 确保表格前后有空行
  const prefix = beforeText.endsWith('\n\n') ? '' : beforeText.endsWith('\n') ? '\n' : '\n\n'
  const suffix = afterText.startsWith('\n\n') ? '' : afterText.startsWith('\n') ? '\n' : '\n\n'
  
  const newText = beforeText + prefix + tableMarkdown + suffix + afterText
  const newPosition = position + prefix.length + tableMarkdown.length + suffix.length
  
  return { newText, newPosition }
}
