import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppSidebar from '../components/AppSidebar';

export default function ScheduleManagement() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');

  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [formData, setFormData] = useState({
    id: null,
    teacher: '',
    classId: '',
    subject: '',
    dayOfWeek: 'Senin',
    startTime: '',
    endTime: '',
    meetingType: 'teori'
  });

  const meetingTypes = [
    { value: 'teori', label: 'Teori', color: 'bg-blue-100 text-blue-700' },
    { value: 'praktik', label: 'Praktik', color: 'bg-green-100 text-green-700' },
    { value: 'pramuka', label: 'Pramuka', color: 'bg-orange-100 text-orange-700' },
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!showFormModal && !deleteTarget) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowFormModal(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showFormModal, deleteTarget]);

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'tata_usaha')) {
      navigate('/dashboard');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scheduleRes, classRes, guruRes, waliRes, subjectRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/schedules`, { headers: { Authorization: `Bearer ${token}`} }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/classes`, { headers: { Authorization: `Bearer ${token}`} }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=guru`, { headers: { Authorization: `Bearer ${token}`} }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=wali_kelas`, { headers: { Authorization: `Bearer ${token}`} }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/subjects`, { headers: { Authorization: `Bearer ${token}`} })
      ]);
      setSchedules(scheduleRes.data.data);
      setClasses(classRes.data.data);
      setSubjects(subjectRes.data.data || []);
      // Gabungkan guru dan wali kelas (wali kelas juga mengajar)
      const allTeachers = [...(guruRes.data.data || []), ...(waliRes.data.data || [])];
      setTeachers(allTeachers);
      if (allTeachers.length === 0) {
        console.warn('Tidak ada guru ditemukan. Pastikan sudah ada user dengan role guru atau wali_kelas.');
      }
    } catch (err) {
      console.error('Gagal mengambil data:', err);
      alert('Gagal mengambil data. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/schedules/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}`}
        });
        alert('Jadwal berhasil diupdate');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/schedules`, formData, {
          headers: { Authorization: `Bearer ${token}`}
        });
        alert('Jadwal berhasil ditambahkan');
      }
      setFormData({ id: null, teacher: '', classId: '', subject: '', dayOfWeek: 'Senin', startTime: '', endTime: '', meetingType: 'teori' });
      setIsEditing(false);
      setShowFormModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan jadwal');
    }
  };

  const handleEdit = (sched) => {
    setIsEditing(true);
    setFormData({
      id: sched._id,
      teacher: sched.teacher?._id || '',
      classId: sched.classId?._id || '',
      subject: sched.subject,
      dayOfWeek: sched.dayOfWeek,
      startTime: sched.startTime,
      endTime: sched.endTime,
      meetingType: sched.meetingType || 'teori'
    });
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      alert('Jadwal berhasil dihapus');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus jadwal');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-poppins text-gray-900 overflow-hidden">
      
      <AppSidebar user={user} onLogout={handleLogout} />

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-maroon leading-tight">SMK Widya Utama</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Jadwal Pelajaran</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
        >
          Kembali
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-gray-50">
        <div className="max-w-4xl mx-auto pb-10">
          
          <div className="mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Manajemen Jadwal Pelajaran</h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">Atur jadwal mengajar guru untuk semua kelas.</p>
          </div>

          <div className="mb-6">
            <button onClick={() => { setIsEditing(false); setFormData({ id: null, teacher: '', classId: '', subject: '', dayOfWeek: 'Senin', startTime: '', endTime: '', meetingType: 'teori' }); setShowFormModal(true); }} className="text-xs font-bold text-white bg-maroon hover:bg-maroon-dark px-6 py-2.5 rounded-md transition">Tambah Jadwal</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">Daftar Jadwal</h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{schedules.length} Jadwal</span>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon"></div>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">Belum ada jadwal terdaftar.</div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hari & Jam</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mapel</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tipe</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Guru</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedules.map((sched) => (
                      <tr key={sched._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="font-bold text-maroon">{sched.dayOfWeek}</span>
                          <div className="text-xs text-gray-500">{sched.startTime} - {sched.endTime}</div>
                        </td>
                        <td className="px-5 py-3">
                          {sched.classId ? `${sched.classId.name} ${sched.classId.major}`: <span className="text-red-500 text-xs">Deleted</span>}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-900">{sched.subject}</td>
                        <td className="px-5 py-3">
                          {(() => {
                            const mt = meetingTypes.find(m => m.value === (sched.meetingType || 'teori'));
                            return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${mt?.color || 'bg-gray-100 text-gray-700'}`}>{mt?.label || 'Teori'}</span>;
                          })()}
                        </td>
                        <td className="px-5 py-3 text-xs">{sched.teacher?.name || '-'}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          <button 
                            onClick={() => handleEdit(sched)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-semibold mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(sched)}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </main>

      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowFormModal(false)}>
          <div className="bg-white w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between"><h3 className="font-bold">{isEditing ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3><button onClick={() => setShowFormModal(false)}>X</button></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <select name="subject" value={formData.subject} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 text-sm rounded-md p-2.5"><option value="">-- Pilih Mata Pelajaran --</option>{subjects.map(s => <option key={s._id} value={s.name}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}</select>
              <select name="meetingType" value={formData.meetingType} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-md p-2.5">{meetingTypes.map(mt => <option key={mt.value} value={mt.value}>{mt.label}</option>)}</select>
              <select name="classId" value={formData.classId} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 text-sm rounded-md p-2.5"><option value="">-- Pilih Kelas --</option>{classes.map(c => <option key={c._id} value={c._id}>{c.name} {c.major} ({c.academicYear})</option>)}</select>
              <select name="teacher" value={formData.teacher} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 text-sm rounded-md p-2.5"><option value="">-- Pilih Guru --</option>{teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
              <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 text-sm rounded-md p-2.5">{daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}</select>
              <div className="grid grid-cols-2 gap-2"><input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 text-sm rounded-md p-2.5" /><input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 text-sm rounded-md p-2.5" /></div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 rounded-md bg-gray-100 text-sm font-semibold">Batal</button><button type="submit" className="px-4 py-2 rounded-md text-white text-sm font-semibold" style={{ background: '#800000' }}>Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold mb-2">Konfirmasi Hapus</h4>
            <p className="text-sm text-gray-600 mb-4">Yakin ingin menghapus jadwal {deleteTarget.subject}?</p>
            <div className="flex justify-end gap-2"><button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md bg-gray-100 text-sm font-semibold">Batal</button><button onClick={async () => { await handleDelete(deleteTarget._id); setDeleteTarget(null); }} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold">Ya, Hapus</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
