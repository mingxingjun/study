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

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-accent/30 focus:border-transparent transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const labelClass = "block text-[11px] font-mono uppercase tracking-wider text-gray-500 mb-1.5";

  return (
    <div className="space-y-5">
      {/* 标题栏 - 衬线 + mono 计数 + 添加按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h3 className="text-2xl text-primary font-serif" style={{ fontWeight: 400 }}>教学资源</h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Resources</span>
          {resourceLinks.length > 0 && (
            <span className="text-[11px] font-mono text-accent-dark tabular-nums ml-1">{resourceLinks.length}</span>
          )}
        </div>
        {!showForm && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus size={15} className="mr-1" strokeWidth={1.8} />
            添加资源
          </Button>
        )}
      </div>

      {/* 添加表单 - 编辑式 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50/60 rounded-xl p-5 space-y-4 border border-gray-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>标题 · Title</label>
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
              <label className={labelClass}>链接 · URL</label>
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
              <label className={labelClass}>来源 · Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className={inputClass}
                placeholder="B站、知乎、MOOC..."
              />
            </div>
            <div>
              <label className={labelClass}>类型 · Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`${inputClass} bg-white custom-select cursor-pointer`}
              >
                {RESOURCE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className={labelClass}>关联知识点 · Knowledge Point</label>
              <select
                value={formData.knowledgePointId}
                onChange={(e) => setFormData({ ...formData, knowledgePointId: e.target.value })}
                className={`${inputClass} bg-white custom-select cursor-pointer`}
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

      {/* 空状态 */}
      {resourceLinks.length === 0 && !showForm && (
        <div className="bg-gray-50/60 rounded-xl p-10 text-center border border-dashed border-gray-300">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-200/80 shadow-sm">
            <Link2 size={22} className="text-gray-400" strokeWidth={1.6} />
          </div>
          <p className="text-sm font-serif text-gray-500" style={{ fontWeight: 500 }}>暂无教学资源</p>
          <p className="text-xs text-gray-400 mt-1 font-mono uppercase tracking-wider">点击上方按钮添加</p>
        </div>
      )}

      {/* 资源列表 - 编辑式编号 */}
      {resourceLinks.length > 0 && (
        <div className="space-y-2.5">
          {resourceLinks.map((resource, idx) => {
            const TypeIcon = getTypeIcon(resource.type);
            return (
              <div
                key={resource.id}
                className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-200/80 card-hover"
              >
                {/* 大号衬线编号 */}
                <div className="flex-shrink-0 w-8 text-right">
                  <span className="font-serif text-xl text-gray-200 tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.04em' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200/80">
                  <TypeIcon size={18} className="text-accent-dark" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-serif text-gray-900 truncate" style={{ fontWeight: 500 }}>{resource.title}</h4>
                    <span className="text-[10px] bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full flex-shrink-0 font-mono tracking-wider border border-accent/30">
                      {getTypeLabel(resource.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-mono">
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
                    <ExternalLink size={15} className="text-gray-500 hover:text-accent-dark" strokeWidth={1.8} />
                  </a>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group cursor-pointer"
                    title="删除"
                  >
                    <Trash2 size={15} className="text-gray-400 group-hover:text-red-600" strokeWidth={1.8} />
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
