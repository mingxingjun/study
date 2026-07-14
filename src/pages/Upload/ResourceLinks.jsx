import { useState } from 'react';
import { Plus, Link2, Video, FileText, BookOpen, GraduationCap, Trash2, ExternalLink } from 'lucide-react';
import Button from '../../components/ui/Button';

const RESOURCE_TYPES = [
  { value: 'video', label: '视频', icon: Video },
  { value: 'article', label: '文章', icon: FileText },
  { value: 'course', label: '课程', icon: GraduationCap },
  { value: 'book', label: '书籍', icon: BookOpen }
];

const ResourceLinks = ({ resourceLinks, knowledgePoints, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    source: '',
    type: 'video',
    knowledgePointId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;
    onAdd(formData);
    setFormData({
      title: '',
      url: '',
      source: '',
      type: 'video',
      knowledgePointId: ''
    });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这条教学资源吗？')) {
      onDelete(id);
    }
  };

  const getTypeIcon = (type) => {
    const typeConfig = RESOURCE_TYPES.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : Link2;
  };

  const getTypeLabel = (type) => {
    const typeConfig = RESOURCE_TYPES.find(t => t.value === type);
    return typeConfig ? typeConfig.label : type;
  };

  const getKpName = (kpId) => {
    if (!kpId) return '未关联';
    const kp = knowledgePoints.find(k => k.id === kpId);
    return kp ? kp.name : '未关联';
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-mono font-medium text-primary">教学资源链接</h3>
          {resourceLinks.length > 0 && (
            <span className="text-xs text-gray-400 font-mono">{resourceLinks.length}</span>
          )}
        </div>
        {!showForm && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus size={15} className="mr-1" />
            添加资源
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-200/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputClass}
                placeholder="资源标题"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className={inputClass}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">来源</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className={inputClass}
                placeholder="B站、知乎、MOOC..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`${inputClass} bg-white`}
              >
                {RESOURCE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">关联知识点</label>
              <select
                value={formData.knowledgePointId}
                onChange={(e) => setFormData({ ...formData, knowledgePointId: e.target.value })}
                className={`${inputClass} bg-white`}
              >
                <option value="">不关联</option>
                {knowledgePoints.map(kp => (
                  <option key={kp.id} value={kp.id}>{kp.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              取消
            </Button>
            <Button type="submit" size="sm">
              添加
            </Button>
          </div>
        </form>
      )}

      {resourceLinks.length === 0 && !showForm && (
        <div className="bg-gray-50 rounded-2xl p-10 text-center border border-dashed border-gray-200">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-200/60">
            <Link2 size={22} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">暂无教学资源，点击上方按钮添加</p>
        </div>
      )}

      {resourceLinks.length > 0 && (
        <div className="space-y-2.5">
          {resourceLinks.map((resource) => {
            const TypeIcon = getTypeIcon(resource.type);
            return (
              <div
                key={resource.id}
                className="bg-white rounded-xl p-4 flex items-center gap-3.5 border border-gray-200/60 card-hover"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                  <TypeIcon size={18} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{resource.title}</h4>
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">
                      {getTypeLabel(resource.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    {resource.source && (
                      <>
                        <span>{resource.source}</span>
                        <span className="text-gray-300">·</span>
                      </>
                    )}
                    <span>{getKpName(resource.knowledgePointId)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="打开链接"
                  >
                    <ExternalLink size={15} className="text-gray-500" />
                  </a>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group cursor-pointer"
                    title="删除"
                  >
                    <Trash2 size={15} className="text-gray-400 group-hover:text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResourceLinks;
