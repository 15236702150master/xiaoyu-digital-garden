import React, { useState, useEffect } from 'react'
import { Cloud, Upload, Download, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { COSService } from '@/lib/cos'
import { NotesStorage, CategoriesStorage, TagsStorage } from '@/lib/storage'

interface CloudStorageProps {
  onClose: () => void
  isDark?: boolean
}

interface BackupFile {
  key: string
  lastModified: string
  size: number
  type: 'notes' | 'categories' | 'tags' | 'full'
}

export default function CloudStorage({ onClose, isDark = false }: CloudStorageProps) {
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadBackupFiles()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadBackupFiles = async () => {
    setLoading(true)
    try {
      const files = await COSService.listFiles('backups/')
      const backupFiles = files.map(file => ({
        key: file.Key,
        lastModified: file.LastModified,
        size: file.Size,
        type: getBackupType(file.Key)
      })).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      
      setBackupFiles(backupFiles)
    } catch (error) {
      showMessage('error', '加载备份文件失败')
    } finally {
      setLoading(false)
    }
  }

  const getBackupType = (key: string): 'notes' | 'categories' | 'tags' | 'full' => {
    if (key.includes('notes')) return 'notes'
    if (key.includes('categories')) return 'categories'
    if (key.includes('tags')) return 'tags'
    return 'full'
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const uploadToCloud = async (type: 'notes' | 'categories' | 'tags' | 'full') => {
    setUploading(true)
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      
      if (type === 'full') {
        // 上传完整备份
        const data = {
          notes: NotesStorage.getNotes(),
          categories: CategoriesStorage.getCategories(),
          tags: TagsStorage.getTags(),
          timestamp: new Date().toISOString()
        }
        await COSService.uploadData(data, `full-backup-${timestamp}.json`, 'backups')
        showMessage('success', '完整备份上传成功')
      } else {
        // 上传单独数据
        let data: unknown
        switch (type) {
          case 'notes':
            data = NotesStorage.getNotes()
            break
          case 'categories':
            data = CategoriesStorage.getCategories()
            break
          case 'tags':
            data = TagsStorage.getTags()
            break
        }
        await COSService.uploadData(data, `${type}-backup-${timestamp}.json`, 'backups')
        showMessage('success', `${type} 备份上传成功`)
      }
      
      await loadBackupFiles()
    } catch (error) {
      showMessage('error', '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const downloadFromCloud = async (file: BackupFile) => {
    try {
      const data = await COSService.downloadData(file.key)
      
      if (file.type === 'full') {
        // 恢复完整备份
        if (confirm('确定要恢复完整备份吗？这将覆盖所有本地数据。')) {
          if (data.notes) NotesStorage.saveNotes(data.notes)
          if (data.categories) CategoriesStorage.saveCategories(data.categories)
          if (data.tags) TagsStorage.saveTags(data.tags)
          showMessage('success', '完整数据恢复成功，请刷新页面')
        }
      } else {
        // 恢复单独数据
        if (confirm(`确定要恢复 ${file.type} 数据吗？这将覆盖本地对应数据。`)) {
          switch (file.type) {
            case 'notes':
              NotesStorage.saveNotes(data)
              break
            case 'categories':
              CategoriesStorage.saveCategories(data)
              break
            case 'tags':
              TagsStorage.saveTags(data)
              break
          }
          showMessage('success', `${file.type} 数据恢复成功，请刷新页面`)
        }
      }
    } catch (error) {
      showMessage('error', '下载失败')
    }
  }

  const deleteFromCloud = async (file: BackupFile) => {
    if (confirm('确定要删除这个备份文件吗？')) {
      try {
        await COSService.deleteFile(file.key)
        showMessage('success', '备份文件删除成功')
        await loadBackupFiles()
      } catch (error) {
        showMessage('error', '删除失败')
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      notes: '笔记',
      categories: '分类',
      tags: '标签',
      full: '完整备份'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      notes: 'bg-blue-100 text-blue-800',
      categories: 'bg-green-100 text-green-800',
      tags: 'bg-purple-100 text-purple-800',
      full: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">云存储管理</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`p-4 border-b ${
            message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </span>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => uploadToCloud('full')}
              disabled={uploading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              上传完整备份
            </button>
            <button
              onClick={() => uploadToCloud('notes')}
              disabled={uploading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              上传笔记
            </button>
            <button
              onClick={() => uploadToCloud('categories')}
              disabled={uploading}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              上传分类
            </button>
            <button
              onClick={() => uploadToCloud('tags')}
              disabled={uploading}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              上传标签
            </button>
            <button
              onClick={loadBackupFiles}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>

        {/* 备份文件列表 */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <h3 className="text-lg font-medium text-gray-900 mb-4">云端备份文件</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : backupFiles.length === 0 ? (
            <div className="text-center py-8">
              <Cloud className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">还没有云端备份文件</p>
              <p className="text-sm text-gray-400">点击上方按钮创建第一个备份</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(file.type)}`}>
                        {getTypeLabel(file.type)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      {file.key.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(file.lastModified)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadFromCloud(file)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      title="下载恢复"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFromCloud(file)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部说明 */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            💡 提示：数据将安全存储在腾讯云COS中，支持跨设备同步和备份恢复。
          </p>
        </div>
      </div>
    </div>
  )
}
