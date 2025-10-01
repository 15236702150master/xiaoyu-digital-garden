import React, { useState } from 'react'
import { X } from 'lucide-react'

interface TableConfig {
  rows: number
  cols: number
  hasHeader: boolean
  theme: string
}

interface TableConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (config: TableConfig) => void
  isDark?: boolean
}

export default function TableConfigModal({ isOpen, onClose, onConfirm, isDark = false }: TableConfigModalProps) {
  const [config, setConfig] = useState<TableConfig>({
    rows: 3,
    cols: 3,
    hasHeader: true,
    theme: 'default'
  })

  const themes = [
    { id: 'default', name: '默认', color: '#f8f9fa' },
    { id: 'blue', name: '蓝色', color: '#e3f2fd' },
    { id: 'green', name: '绿色', color: '#e8f5e8' },
    { id: 'yellow', name: '黄色', color: '#fff8e1' },
    { id: 'gray', name: '灰色', color: '#f5f5f5' }
  ]

  const handleConfirm = () => {
    onConfirm(config)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-96 rounded-lg shadow-xl border ${
        isDark 
          ? 'bg-[#2a2a2a] border-[#404040]' 
          : 'bg-white border-gray-200'
      }`}>
        {/* 标题栏 */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-[#404040]' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-medium ${
            isDark ? 'text-[#e0e0e0]' : 'text-gray-900'
          }`}>
            插入表格
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-opacity-10 ${
              isDark ? 'text-[#a0a0a0] hover:bg-white' : 'text-gray-400 hover:bg-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-4 space-y-4">
          {/* 行列配置 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
              }`}>
                行数
              </label>
              <select
                value={config.rows}
                onChange={(e) => setConfig({ ...config, rows: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 rounded border ${
                  isDark 
                    ? 'bg-[#1a1a1a] border-[#404040] text-[#e0e0e0]' 
                    : 'bg-white border-gray-300 text-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
              }`}>
                列数
              </label>
              <select
                value={config.cols}
                onChange={(e) => setConfig({ ...config, cols: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 rounded border ${
                  isDark 
                    ? 'bg-[#1a1a1a] border-[#404040] text-[#e0e0e0]' 
                    : 'bg-white border-gray-300 text-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                {[2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 表头选项 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasHeader"
              checked={config.hasHeader}
              onChange={(e) => setConfig({ ...config, hasHeader: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/20"
            />
            <label 
              htmlFor="hasHeader" 
              className={`ml-2 text-sm ${
                isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
              }`}
            >
              包含表头
            </label>
          </div>

          {/* 主题选择 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
            }`}>
              表格主题
            </label>
            <div className="grid grid-cols-5 gap-2">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setConfig({ ...config, theme: theme.id })}
                  className={`p-2 rounded border-2 text-xs ${
                    config.theme === theme.id
                      ? 'border-blue-500'
                      : isDark ? 'border-[#404040]' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: theme.color }}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* 预览 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
            }`}>
              预览
            </label>
            <div className={`p-3 rounded border ${
              isDark ? 'border-[#404040] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
            }`}>
              <table className="w-full text-xs border-collapse">
                {config.hasHeader && (
                  <thead>
                    <tr>
                      {Array.from({ length: config.cols }, (_, i) => (
                        <th key={i} className={`border p-1 font-medium ${
                          isDark ? 'border-[#404040] text-[#e0e0e0]' : 'border-gray-300 text-gray-700'
                        }`}>
                          列{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {Array.from({ length: config.hasHeader ? config.rows - 1 : config.rows }, (_, i) => (
                    <tr key={i}>
                      {Array.from({ length: config.cols }, (_, j) => (
                        <td key={j} className={`border p-1 ${
                          isDark ? 'border-[#404040] text-[#a0a0a0]' : 'border-gray-300 text-gray-600'
                        }`}>
                          内容
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 按钮区 */}
        <div className={`flex justify-end gap-2 p-4 border-t ${
          isDark ? 'border-[#404040]' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded ${
              isDark 
                ? 'text-[#a0a0a0] hover:bg-[#404040]' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            插入表格
          </button>
        </div>
      </div>
    </div>
  )
}

export type { TableConfig }
