import React, { useState, useRef } from 'react'
import { Upload, X, File, Image, AlertCircle } from 'lucide-react'

interface FileUploaderProps {
  onUploadSuccess?: (result: { url: string; name: string }) => void
  onUploadError?: (error: string) => void
  accept?: string
  maxSize?: number // MB
  isDark?: boolean
}

export default function FileUploader({
  onUploadSuccess,
  onUploadError,
  accept = "image/*,.pdf,.doc,.docx,.txt,.md",
  maxSize = 10,
  isDark = false
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const file = files[0]
    if (!file) return

    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      onUploadError?.(`文件大小不能超过 ${maxSize}MB`)
      return
    }

    // 模拟上传成功（实际项目中这里应该是真实的上传逻辑）
    setTimeout(() => {
      const result = {
        url: URL.createObjectURL(file),
        name: file.name
      }
      onUploadSuccess?.(result)
    }, 1000)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          拖拽文件到此处，或
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 ml-1"
          >
            点击选择文件
          </button>
        </p>
        <p className="text-xs text-gray-400">
          支持的格式: {accept} (最大 {maxSize}MB)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  )
}
