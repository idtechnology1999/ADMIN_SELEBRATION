import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Video, Save, X, Loader2, BookOpen, Play } from 'lucide-react';
import { adminApi, fixUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import FileUpload from '../components/FileUpload';

const STAGES = [
  { key: 'fish',    label: 'Become a Fish',    color: 'bg-blue-100 text-blue-700'    },
  { key: 'dolphin', label: 'Become a Dolphin', color: 'bg-cyan-100 text-cyan-700'    },
  { key: 'shark',   label: 'Become a Shark',   color: 'bg-purple-100 text-purple-700' },
  { key: 'whale',   label: 'Become a Whale',   color: 'bg-amber-100 text-amber-700'  },
];

interface VideoItem  { _id: string; title: string; description: string; videoUrl: string; }
interface StageSlot  { stage: string; videos: VideoItem[]; }
interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  status: string;
  whatYouLearn: string[];
  stage: string;
  stages: StageSlot[];
}

export default function Courses() {
  const toast = useToast();
  const [courses,  setCourses]  = useState<Course[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Course | null>(null);
  const [activeStage, setActiveStage] = useState('fish');

  // ── Create course modal ──
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle,  setNewTitle]  = useState('');
  const [newDesc,   setNewDesc]   = useState('');
  const [newThumb,  setNewThumb]  = useState('');
  const [newWYL,    setNewWYL]    = useState<string[]>([]);
  const [newBullet, setNewBullet] = useState('');
  const [creating,  setCreating]  = useState(false);

  // ── Edit course modal ──
  const [showEdit,   setShowEdit]   = useState(false);
  const [editTitle,  setEditTitle]  = useState('');
  const [editDesc,   setEditDesc]   = useState('');
  const [editThumb,  setEditThumb]  = useState('');
  const [editWYL,    setEditWYL]    = useState<string[]>([]);
  const [editBullet, setEditBullet] = useState('');
  const [saving,     setSaving]     = useState(false);

  // ── Add / Edit video modal ──
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [editVideo,    setEditVideo]    = useState<VideoItem | null>(null);
  const [videoTitle,   setVideoTitle]   = useState('');
  const [videoDesc,    setVideoDesc]    = useState('');
  const [videoUrl,     setVideoUrl]     = useState('');
  const [savingVideo,  setSavingVideo]  = useState(false);

  // ── Data ──

  const load = async () => {
    setLoading(true);
    const res = await adminApi.courses.list();
    if (res.success && res.data) setCourses(res.data as Course[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stageCourses  = courses.filter(c => c.stage === activeStage);
  const currentMeta   = STAGES.find(s => s.key === activeStage)!;
  const courseVideos  = selected
    ? (selected.stages.find(s => s.stage === activeStage)?.videos ?? [])
    : [];

  // ── Handlers — courses ──

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error('Title required'); return; }
    setCreating(true);
    const res = await adminApi.courses.create({
      title: newTitle, description: newDesc, thumbnail: newThumb,
      status: 'active', stage: activeStage, whatYouLearn: newWYL,
    });
    if (res.success) {
      toast.success('Course created');
      closeCreate();
      await load();
      setSelected(res.data as Course);
    } else {
      toast.error('Failed to create course', res.message);
    }
    setCreating(false);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setNewTitle(''); setNewDesc(''); setNewThumb(''); setNewWYL([]); setNewBullet('');
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditTitle(selected.title);
    setEditDesc(selected.description);
    setEditThumb(selected.thumbnail ?? '');
    setEditWYL(selected.whatYouLearn ?? []);
    setEditBullet('');
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!selected || !editTitle.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    const res = await adminApi.courses.update(selected._id, {
      title: editTitle, description: editDesc,
      thumbnail: editThumb, whatYouLearn: editWYL,
    });
    if (res.success) {
      toast.success('Course updated');
      setShowEdit(false);
      const updated = res.data as Course;
      setCourses(c => c.map(x => x._id === updated._id ? updated : x));
      setSelected(updated);
    } else {
      toast.error('Failed to update course', res.message);
    }
    setSaving(false);
  };

  const handleToggleStatus = async (course: Course, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = course.status === 'active' ? 'inactive' : 'active';
    const res = await adminApi.courses.update(course._id, { status: next });
    if (res.success) {
      const updated = res.data as Course;
      setCourses(c => c.map(x => x._id === updated._id ? updated : x));
      if (selected?._id === updated._id) setSelected(updated);
      toast.success(`Course marked ${next}`);
    } else {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteCourse = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this course and all its videos?')) return;
    const res = await adminApi.courses.delete(id);
    if (res.success) {
      toast.success('Course deleted');
      if (selected?._id === id) setSelected(null);
      setCourses(c => c.filter(x => x._id !== id));
    } else {
      toast.error('Failed to delete course');
    }
  };

  // ── Handlers — videos ──

  const handleAddVideo = async () => {
    if (!videoTitle.trim() || !videoUrl.trim()) { toast.error('Title and video are required'); return; }
    setSavingVideo(true);
    const res = await (adminApi as any).courses.addVideo(
      selected!._id, activeStage,
      { title: videoTitle, description: videoDesc, videoUrl },
    );
    if (res.success) {
      toast.success('Video added');
      closeVideoModal();
      const updated = res.data as Course;
      setCourses(c => c.map(x => x._id === updated._id ? updated : x));
      setSelected(updated);
    } else {
      toast.error('Failed to add video', res.message);
    }
    setSavingVideo(false);
  };

  const handleSaveVideo = async () => {
    if (!editVideo || !videoTitle.trim()) return;
    setSavingVideo(true);
    const res = await (adminApi as any).courses.updateVideo(
      selected!._id, activeStage, editVideo._id,
      { title: videoTitle, description: videoDesc, videoUrl },
    );
    if (res.success) {
      toast.success('Video updated');
      closeVideoModal();
      const updated = res.data as Course;
      setCourses(c => c.map(x => x._id === updated._id ? updated : x));
      setSelected(updated);
    } else {
      toast.error('Failed to update video', res.message);
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
    } else {
      toast.error('Failed to delete video');
    }
  };

  const openEditVideo = (v: VideoItem) => {
    setEditVideo(v); setVideoTitle(v.title); setVideoDesc(v.description); setVideoUrl(v.videoUrl);
  };

  const closeVideoModal = () => {
    setShowAddVideo(false); setEditVideo(null);
    setVideoTitle(''); setVideoDesc(''); setVideoUrl('');
  };

  // ── Render ──

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage courses and videos by stage</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#F5820A' }}>
          <Plus size={15} /> New Course
        </button>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {STAGES.map(st => {
          const count = courses.filter(c => c.stage === st.key).length;
          return (
            <button
              key={st.key}
              onClick={() => { setActiveStage(st.key); setSelected(null); }}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeStage === st.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {st.label}
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                {count} course{count !== 1 ? 's' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-6" style={{ minHeight: '620px' }}>

        {/* LEFT — course list for active stage */}
        <div className="w-72 shrink-0 flex flex-col gap-2">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-orange-400" size={28} />
            </div>
          ) : stageCourses.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center flex flex-col items-center">
              <BookOpen size={36} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No courses in {currentMeta.label}</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Create the first course for this stage</p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#F5820A' }}>
                <Plus size={14} /> Add Course
              </button>
            </div>
          ) : (
            stageCourses.map(c => {
              const videoCount = c.stages.find(s => s.stage === c.stage)?.videos.length ?? 0;
              return (
                <div
                  key={c._id}
                  onClick={() => setSelected(c)}
                  className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selected?._id === c._id
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-orange-200'
                  }`}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                    {c.thumbnail
                      ? <img src={fixUrl(c.thumbnail)} alt={c.title} className="w-full h-full object-cover" />
                      : <BookOpen size={18} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{videoCount} video{videoCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={e => handleToggleStatus(c, e)}
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                        c.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {c.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={e => handleDeleteCourse(c._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT — video list for selected course */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col items-center justify-center text-center p-12">
              <BookOpen size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium text-sm">Select a course to manage its videos</p>
              <p className="text-xs text-gray-400 mt-1">
                {stageCourses.length > 0
                  ? 'Click a course on the left'
                  : `Add a course to ${currentMeta.label} first`}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden h-full">

              {/* Course header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                      {selected.thumbnail
                        ? <img src={fixUrl(selected.thumbnail)} alt={selected.title} className="w-full h-full object-cover" />
                        : <BookOpen size={20} className="text-gray-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-lg text-gray-900 leading-tight">{selected.title}</h2>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${currentMeta.color}`}>
                          {currentMeta.label}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(selected)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                            selected.status === 'active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                          {selected.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                      {selected.description && (
                        <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{selected.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={openEditModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 shrink-0 transition-colors">
                    <Edit2 size={13} /> Edit
                  </button>
                </div>

                {/* What You'll Learn pills */}
                {(selected.whatYouLearn?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selected.whatYouLearn.map((item, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos section */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-700">
                    Videos
                    <span className="ml-2 text-gray-400 font-normal">{courseVideos.length}</span>
                  </p>
                  <button
                    onClick={() => { setShowAddVideo(true); setVideoTitle(''); setVideoDesc(''); setVideoUrl(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                    style={{ background: '#F5820A' }}>
                    <Plus size={14} /> Add Video
                  </button>
                </div>

                {courseVideos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(245,130,10,0.08)' }}>
                      <Video size={28} style={{ color: '#F5820A', opacity: 0.5 }} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No videos yet</p>
                    <p className="text-xs text-gray-400 mt-1 mb-5">Add the first video to this course</p>
                    <button
                      onClick={() => { setShowAddVideo(true); setVideoTitle(''); setVideoDesc(''); setVideoUrl(''); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: '#F5820A' }}>
                      <Plus size={14} /> Add First Video
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseVideos.map((v, i) => (
                      <div
                        key={v._id}
                        className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 bg-gray-50 hover:bg-orange-50/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,130,10,0.12)' }}>
                          <Play size={14} style={{ color: '#F5820A' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{i + 1}. {v.title}</p>
                          {v.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{v.description}</p>
                          )}
                          <p className="text-xs text-blue-500 mt-1 truncate">{v.videoUrl}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditVideo(v)}
                            className="p-1.5 rounded hover:bg-gray-200 transition-colors">
                            <Edit2 size={13} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(v._id)}
                            className="p-1.5 rounded hover:bg-red-50 transition-colors">
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE COURSE MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold">New Course</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Adding to <span className="font-semibold" style={{ color: '#F5820A' }}>{currentMeta.label}</span>
                </p>
              </div>
              <button onClick={closeCreate}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                <input
                  value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Introduction to Affiliate Marketing"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3}
                  placeholder="Brief description of the course..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                <FileUpload type="image" value={newThumb} onChange={r => setNewThumb(r?.url ?? '')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What You'll Learn</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={newBullet} onChange={e => setNewBullet(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newBullet.trim()) {
                        setNewWYL(p => [...p, newBullet.trim()]); setNewBullet(''); e.preventDefault();
                      }
                    }}
                    placeholder="Type a bullet point, press Enter to add"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  <button
                    onClick={() => { if (newBullet.trim()) { setNewWYL(p => [...p, newBullet.trim()]); setNewBullet(''); }}}
                    className="px-3 py-2 rounded-lg text-white text-sm font-semibold shrink-0"
                    style={{ background: '#F5820A' }}>
                    <Plus size={15} />
                  </button>
                </div>
                {newWYL.length > 0 && (
                  <ul className="space-y-1.5">
                    {newWYL.map((item, i) => (
                      <li key={i} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-1.5">
                        <span className="text-sm text-gray-700">• {item}</span>
                        <button onClick={() => setNewWYL(p => p.filter((_, j) => j !== i))}>
                          <X size={13} className="text-gray-400 hover:text-red-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={handleCreate} disabled={creating}
                className="w-full py-2.5 rounded-lg font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ background: '#F5820A' }}>
                {creating ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT COURSE MODAL ── */}
      {showEdit && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Edit Course</h3>
              <button onClick={() => setShowEdit(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                <input
                  value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                <FileUpload type="image" value={editThumb} onChange={r => setEditThumb(r?.url ?? '')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What You'll Learn</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={editBullet} onChange={e => setEditBullet(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && editBullet.trim()) {
                        setEditWYL(p => [...p, editBullet.trim()]); setEditBullet(''); e.preventDefault();
                      }
                    }}
                    placeholder="Type a bullet point, press Enter to add"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  <button
                    onClick={() => { if (editBullet.trim()) { setEditWYL(p => [...p, editBullet.trim()]); setEditBullet(''); }}}
                    className="px-3 py-2 rounded-lg text-white text-sm font-semibold shrink-0"
                    style={{ background: '#F5820A' }}>
                    <Plus size={15} />
                  </button>
                </div>
                {editWYL.length > 0 && (
                  <ul className="space-y-1.5">
                    {editWYL.map((item, i) => (
                      <li key={i} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-1.5">
                        <span className="text-sm text-gray-700">• {item}</span>
                        <button onClick={() => setEditWYL(p => p.filter((_, j) => j !== i))}>
                          <X size={13} className="text-gray-400 hover:text-red-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={handleSaveEdit} disabled={saving}
                className="w-full py-2.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
                style={{ background: '#F5820A' }}>
                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT VIDEO MODAL ── */}
      {(showAddVideo || editVideo) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold">{editVideo ? 'Edit Video' : 'Add Video'}</h3>
                {!editVideo && (
                  <p className="text-xs text-gray-500 mt-0.5">{selected?.title}</p>
                )}
              </div>
              <button onClick={closeVideoModal}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Title *</label>
                <input
                  value={videoTitle} onChange={e => setVideoTitle(e.target.value)}
                  placeholder="e.g. Introduction to the course"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea
                  value={videoDesc} onChange={e => setVideoDesc(e.target.value)} rows={2}
                  placeholder="What will the student learn in this video?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video *</label>
                <FileUpload type="video" value={videoUrl} onChange={r => setVideoUrl(r?.url ?? '')} />
              </div>

              <button
                onClick={editVideo ? handleSaveVideo : handleAddVideo} disabled={savingVideo}
                className="w-full py-2.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
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
