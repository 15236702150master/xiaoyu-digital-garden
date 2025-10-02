import React, { useState, useEffect } from 'react'
import { X, Plus, Edit2, Trash2, Tag as TagIcon, Hash } from 'lucide-react'
import { Tag } from '@/types'
import { TagsStorage } from '@/lib/storage'
import { checkTagMaster } from '@/utils/easterEggTriggers'

interface TagManagerProps {
  onClose: () => void
  isDark?: boolean
}

export default function TagManager({ onClose, isDark = false }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ef4444', '#06b6d4', '#84cc16', '#f97316',
    '#ec4899', '#6366f1', '#14b8a6', '#eab308'
  ]

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = () => {
    const allTags = TagsStorage.getTags()
    setTags(allTags.sort((a, b) => b.count - a.count))
    
    // 检查是否创建了20个不同标签
    checkTagMaster(allTags.length)
  }

  const handleAddTag = () => {
    if (!newTagName.trim()) return

    TagsStorage.addTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setNewTagColor('#3b82f6')
    setIsAddingTag(false)
    loadTags()
  }

  const handleUpdateTag = () => {
    if (!editingTag || !newTagName.trim()) return

    TagsStorage.updateTag(editingTag.id, {
      name: newTagName.trim(),
      color: newTagColor
    })
    setEditingTag(null)
    setNewTagName('')
    setNewTagColor('#3b82f6')
    loadTags()
  }

  const handleDeleteTag = (tagId: string) => {
    if (confirm('确定要删除这个标签吗？这不会影响已有笔记中的标签。')) {
      TagsStorage.deleteTag(tagId)
      loadTags()
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingTag(tag)
    setNewTagName(tag.name)
    setNewTagColor(tag.color)
    setIsAddingTag(false)
  }

  const cancelEdit = () => {
    setEditingTag(null)
    setIsAddingTag(false)
    setNewTagName('')
    setNewTagColor('#3b82f6')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">标签管理</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* 添加新标签按钮 */}
          {!isAddingTag && !editingTag && (
            <button
              onClick={() => setIsAddingTag(true)}
              className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <Plus className="w-5 h-5" />
              添加新标签
            </button>
          )}

          {/* 添加/编辑标签表单 */}
          {(isAddingTag || editingTag) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-900">
                {editingTag ? '编辑标签' : '添加新标签'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标签名称
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="输入标签名称..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标签颜色
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newTagColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={editingTag ? handleUpdateTag : handleAddTag}
                    disabled={!newTagName.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingTag ? '更新' : '添加'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 标签列表 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              现有标签 ({tags.length})
            </h3>
            
            {tags.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TagIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>还没有创建任何标签</p>
                <p className="text-sm">点击上方按钮创建第一个标签</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-gray-900">{tag.name}</span>
                      <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {tag.count} 个笔记
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(tag)}
                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                        title="编辑标签"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                        title="删除标签"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            💡 提示：删除标签不会影响已有笔记中的标签内容，只是从管理列表中移除。
          </p>
        </div>
      </div>
    </div>
  )
}
