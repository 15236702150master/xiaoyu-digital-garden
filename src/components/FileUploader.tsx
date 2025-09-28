import React, { useState, useRef } from 'react'
import { Upload, X, File, Image, Check, AlertCircle } from 'lucide-react'
import { COSService, UploadResult } from '@/lib/cos'

interface FileUploaderProps {
  onUploadSuccess?: (result: UploadResult) => void
  onUploadError?: (error: string) => void
  accept?: string
  maxSize?: number // MB
  folder?: string
  isDark?: boolean
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  result?: UploadResult
  error?: string
}

export default function FileUploader({
  onUploadSuccess,
  onUploadError,
  accept = "image/*,.pdf,.doc,.docx,.txt,.md",
  maxSize = 10,
  folder = 'uploads',
  isDark = false
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        onUploadError?.(`文件 ${file.name} 超过 ${maxSize}MB 限制`)
        return false
      }
      return true
    })

    validFiles.forEach(uploadFile)
  }

  const uploadFile = async (file: File) => {
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading'
    }

    setUploadingFiles(prev => [...prev, uploadingFile])

    try {
      const result = await COSService.uploadFile(file, folder)
      
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'success', progress: 100, result }
            : f
        )
      )

      onUploadSuccess?.(result)

      // 3秒后移除成功的文件
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.file !== file))
      }, 3000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败'
      
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      )

      onUploadError?.(errorMessage)
    }
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

  const removeFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file))
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <Image className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : isDark 
              ? 'border-gray-600 hover:border-gray-500 bg-gray-800' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`} />
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          点击选择文件或拖拽文件到此处
        </p>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          支持图片、文档等格式，最大 {maxSize}MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* 上传进度列表 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-3 p-3 rounded-lg border
                ${isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
                }
              `}
            >
              {/* 文件图标 */}
              <div className={`
                p-2 rounded
                ${uploadingFile.status === 'success' 
                  ? 'bg-green-100 text-green-600' 
                  : uploadingFile.status === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600'
                }
              `}>
                {uploadingFile.status === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : uploadingFile.status === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  getFileIcon(uploadingFile.file.name)
                )}
              </div>

              {/* 文件信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium truncate ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    {uploadingFile.file.name}
                  </p>
                  <span className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatFileSize(uploadingFile.file.size)}
                  </span>
                </div>

                {/* 进度条或状态 */}
                {uploadingFile.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadingFile.status === 'success' && uploadingFile.result && (
                  <p className="text-xs text-green-600 mt-1">
                    上传成功 - {uploadingFile.result.url}
                  </p>
                )}

                {uploadingFile.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    {uploadingFile.error}
                  </p>
                )}
              </div>

              {/* 删除按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(uploadingFile.file)
                }}
                className={`
                  p-1 rounded hover:bg-gray-100
                  ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}
                `}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
