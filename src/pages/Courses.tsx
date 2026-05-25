import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Video, Save, X, Loader2, BookOpen, Play, ChevronRight } from 'lucide-react';
import { adminApi, fixUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import FileUpload from '../components/FileUpload';

const STAGES = [
  { key: 'free',  label: 'Free',             price: 0,      color: 'bg-green-100 text-green-700',  border: 'border-green-400' },
  { key: 'fish',  label: 'Become a Fish',    price: 5000,   color: 'bg-blue-100 text-blue-700',    border: 'border-blue-400' },
  { key: 'shark', label: 'Become a Shark',   price: 15000,  color: 'bg-purple-100 text-purple-700',border: 'border-purple-400' },
  { key: 'whale', label: 'Become a Whale',   price: 150000, color: 'bg-amber-100 text-amber-700',  border: 'border-amber-400' },
];

interface Video { _id: string; title: string; description: string; videoUrl: string; }
interface Stage { stage: string; videos: Video[]; }
interface Course { _id: string; title: string; description: string; thumbnail: string; status: string; whatYouLearn: string[]; stages: Stage[]; }

export default function Courses() {
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Course | null>(null);
  const [activeStage, setActiveStage] = useState('free');

  // Create course modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newThumb, setNewThumb] = useState('');
  const [creating, setCreating] = useState(false);

  // Add video modal
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);

  // Edit video
  const [editVideo, setEditVideo] = useState<Video | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await adminApi.courses.list();
    if (res.success && res.data) setCourses(res.data as Course[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error('Title required'); return; }
    setCreating(true);
    const res = await adminApi.courses.create({ title: newTitle, description: newDesc, thumbnail: newThumb, status: 'active' });
    if (res.success) {
      toast.success('Course created', '4 stages have been added automatically.');
      setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewThumb('');
      await load();
      setSelected(res.data as Course);
    } else {
      toast.error('Failed', res.message);
    }
    setCreating(false);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Delete this course and all its videos?')) return;
    const res = await adminApi.courses.delete(id);
    if (res.success) {
      toast.success('Course deleted');
      if (selected?._id === id) setSelected(null);
      setCourses(c => c.filter(x => x._id !== id));
    }
  };

  const handleAddVideo = async () => {
    if (!videoTitle.trim() || !videoUrl.trim()) { toast.error('Title and video URL required'); return; }
    setSavingVideo(true);
    const res = await (adminApi as any).courses.addVideo(selected!._id, activeStage, { title: videoTitle, description: videoDesc, videoUrl });
    if (res.success) {
      toast.success('Video added');
      setShowAddVideo(false); setVideoTitle(''); setVideoDesc(''); setVideoUrl('');
      const updated = res.data as Course;
      setCourses(c => c.map(x => x._id === updated._id ? updated : x));
      setSelected(updated);
    } else {
      toast.error('Failed', res.message);
    }
    setSavingVideo(false);
  };

  const handleEditVideo = async () => {
    if (!editVideo || !videoTitle.trim()) return;
    setSavingVideo(true);
    const res = await (adminApi as any).courses.updateVideo(selected!._id, activeStage, editVideo._id, { title: videoTitle, description: videoDesc, videoUrl });
    if (res.success) {
      toast.success('Video updated');
      setEditVideo(null); setVideoTitle(''); setVideoDesc(''); setVideoUrl('');
      const updated = res.data as Course;
      setCourses(c => c.map(x => x._id === updated._id ? updated : x));
      setSelected(updated);
    } else {
      toast.error('Failed', res.message);
    }
    setSavingVideo(false);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Delete this video?')) return;
    const res = await (adminApi as any).courses.deleteVideo(selected!._id, activeStage, videoId);
    if (res.success) {
      toast.success('Video deleted');
      const updated = res.data as Course;
      setCourses(c => c.map(x => x._id === updated._id ? updated : x));
      setSelected(updated);
    }
  };

  const openEdit = (v: Video) => {
    setEditVideo(v); setVideoTitle(v.title); setVideoDesc(v.description); setVideoUrl(v.videoUrl);
  };

  const currentStageData = selected?.stages.find(s => s.stage === activeStage);
  const currentStageMeta = STAGES.find(s => s.key === activeStage)!;

  return (
    <div className="flex gap-6 h-full min-h-0">

      {/* LEFT — Course list */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Courses</h1>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#F5820A' }}>
            <Plus size={15} /> New
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-400" size={28} /></div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No courses yet</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {courses.map(c => (
              <div key={c._id}
                onClick={() => { setSelected(c); setActiveStage('free'); }}
                className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selected?._id === c._id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                  {c.thumbnail
                    ? <img src={fixUrl(c.thumbnail)} alt={c.title} className="w-full h-full object-cover" />
                    : <BookOpen size={18} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.stages?.reduce((n, s) => n + s.videos.length, 0)} videos</p>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDeleteCourse(c._id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Stage editor */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col items-center justify-center text-center p-12">
            <BookOpen size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-400">Select a course to manage its stages</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden">
            {/* Course header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-gray-900">{selected.title}</h2>
                <p className="text-sm text-gray-400">{selected.description}</p>
              </div>
            </div>

            {/* Stage tabs */}
            <div className="flex border-b border-gray-100 px-6 gap-1 pt-3">
              {STAGES.map(st => (
                <button key={st.key} onClick={() => setActiveStage(st.key)}
                  className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-all border-b-2 ${
                    activeStage === st.key
                      ? `border-orange-500 text-orange-600 bg-orange-50`
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {st.label}
                  <span className="ml-1.5 text-xs font-normal text-gray-400">
                    {st.price > 0 ? `₦${st.price.toLocaleString()}` : 'Free'}
                  </span>
                </button>
              ))}
            </div>

            {/* Videos list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${currentStageMeta.color}`}>{currentStageMeta.label}</span>
                  <span className="text-sm text-gray-400">{currentStageData?.videos.length ?? 0} video{(currentStageData?.videos.length ?? 0) !== 1 ? 's' : ''}</span>
                </div>
                <button onClick={() => { setShowAddVideo(true); setVideoTitle(''); setVideoDesc(''); setVideoUrl(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: '#F5820A' }}>
                  <Plus size={14} /> Add Video
                </button>
              </div>

              {currentStageData?.videos.length === 0 && (
                <div className="text-center py-10 text-gray-300">
                  <Video size={36} className="mx-auto mb-2" />
                  <p className="text-sm">No videos yet — click Add Video</p>
                </div>
              )}

              {currentStageData?.videos.map((v, i) => (
                <div key={v._id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <Play size={14} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{i + 1}. {v.title}</p>
                    {v.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{v.description}</p>}
                    <p className="text-xs text-blue-500 mt-1 truncate">{v.videoUrl}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-gray-200">
                      <Edit2 size={13} className="text-gray-500" />
                    </button>
                    <button onClick={() => handleDeleteVideo(v._id)} className="p-1.5 rounded hover:bg-red-50">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE COURSE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">New Course</h3>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Digital Marketing Mastery"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3}
                  placeholder="Brief description of the course..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                <FileUpload
                  type="image"
                  value={newThumb}
                  onChange={r => setNewThumb(r?.url ?? '')}
                />
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                4 stages (Free, Fish, Shark, Whale) will be created automatically.
              </div>
              <button onClick={handleCreate} disabled={creating}
                className="w-full py-2.5 rounded-lg font-semibold text-white disabled:opacity-60"
                style={{ background: '#F5820A' }}>
                {creating ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT VIDEO MODAL */}
      {(showAddVideo || editVideo) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editVideo ? 'Edit Video' : `Add Video — ${currentStageMeta.label}`}</h3>
              <button onClick={() => { setShowAddVideo(false); setEditVideo(null); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Title *</label>
                <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)}
                  placeholder="e.g. Introduction to the course"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea value={videoDesc} onChange={e => setVideoDesc(e.target.value)} rows={2}
                  placeholder="What will the student learn in this video?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video *</label>
                <FileUpload
                  type="video"
                  value={videoUrl}
                  onChange={r => setVideoUrl(r?.url ?? '')}
                />
              </div>
              <button onClick={editVideo ? handleEditVideo : handleAddVideo} disabled={savingVideo}
                className="w-full py-2.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#F5820A' }}>
                <Save size={15} />
                {savingVideo ? 'Saving...' : editVideo ? 'Save Changes' : 'Add Video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
