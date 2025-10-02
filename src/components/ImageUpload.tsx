'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Clipboard } from 'lucide-react'
import { checkFirstImageUpload } from '../utils/easterEggTriggers'

interface ImageUploadProps {
  isDark: boolean
  onImageSelect: (imageData: string) => void
  onClose: () => void
}

export default function ImageUpload({ isDark, onImageSelect, onClose }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理图片文件转换为Base64
  const processImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 限制文件大小为5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件大小不能超过5MB')
      return
    }

    setIsProcessing(true)

    try {
      // 创建图片元素用于压缩
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        // 计算压缩后的尺寸，保持宽高比
        const maxWidth = 800
        const maxHeight = 600
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        // 设置画布尺寸
        canvas.width = width
        canvas.height = height

        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height)

        // 转换为Base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setPreview(compressedDataUrl)
        setIsProcessing(false)
      }

      img.onerror = () => {
        alert('图片加载失败')
        setIsProcessing(false)
      }

      // 读取文件
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('图片处理失败:', error)
      alert('图片处理失败')
      setIsProcessing(false)
    }
  }, [])

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      processImageFile(files[0])
    }
  }

  // 处理拖拽
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0])
    }
  }, [processImageFile])

  // 处理粘贴
  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type)
            const file = new File([blob], 'pasted-image.png', { type })
            processImageFile(file)
            return
          }
        }
      }
      alert('剪贴板中没有图片')
    } catch (error) {
      console.error('粘贴失败:', error)
      alert('粘贴失败，请尝试直接上传文件')
    }
  }, [processImageFile])

  // 确认插入图片
  const handleConfirm = () => {
    if (preview) {
      onImageSelect(preview)
      // 触发首次上传图片彩蛋
      checkFirstImageUpload()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 上传对话框 */}
      <div className={`relative w-full max-w-md mx-4 rounded-lg shadow-2xl ${
        isDark ? 'bg-[#2a2a2a] border border-[#404040]' : 'bg-white border border-gray-200'
      }`}>
        {/* 头部 */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-[#404040]' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-medium ${
            isDark ? 'text-[#e0e0e0]' : 'text-gray-900'
          }`}>
            插入图片
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-[#404040] ${
              isDark ? 'text-[#a0a0a0]' : 'text-gray-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-4 space-y-4">
          {!preview ? (
            <>
              {/* 拖拽上传区域 */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? (isDark ? 'border-blue-400 bg-blue-500/10' : 'border-blue-500 bg-blue-50')
                    : (isDark ? 'border-[#404040] hover:border-[#606060]' : 'border-gray-300 hover:border-gray-400')
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <ImageIcon className={`w-12 h-12 mx-auto mb-4 ${
                  isDark ? 'text-[#a0a0a0]' : 'text-gray-400'
                }`} />
                <p className={`text-sm mb-2 ${
                  isDark ? 'text-[#e0e0e0]' : 'text-gray-700'
                }`}>
                  拖拽图片到此处，或
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  disabled={isProcessing}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  选择文件
                </button>
              </div>

              {/* 粘贴按钮 */}
              <div className="text-center">
                <button
                  onClick={handlePaste}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-[#404040] hover:bg-[#505050] text-[#e0e0e0]'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  disabled={isProcessing}
                >
                  <Clipboard className="w-4 h-4 inline mr-2" />
                  从剪贴板粘贴
                </button>
              </div>

              {isProcessing && (
                <div className={`text-center text-sm ${
                  isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
                }`}>
                  处理图片中...
                </div>
              )}
            </>
          ) : (
            <>
              {/* 图片预览 */}
              <div className="text-center">
                <img
                  src={preview}
                  alt="预览"
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPreview(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-[#404040] hover:bg-[#505050] text-[#e0e0e0]'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  重新选择
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  确认插入
                </button>
              </div>
            </>
          )}
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  )
}
