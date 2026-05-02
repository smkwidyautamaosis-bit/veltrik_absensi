import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ScheduleManagement() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');

  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [formData, setFormData] = useState({
    id: null,
    teacher: '',
    classId: '',
    subject: '',
    dayOfWeek: 'Senin',
    startTime: '',
    endTime: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const [scheduleRes, classRes, teacherRes] = await Promise.all([
        axios.get('http://localhost:5000/api/schedules', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/classes', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/users?role=guru', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSchedules(scheduleRes.data.data);
      setClasses(classRes.data.data);
      setTeachers(teacherRes.data.data);
    } catch (err) {
      console.error('Gagal mengambil data', err);
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
        await axios.put(`http://localhost:5000/api/schedules/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Jadwal berhasil diupdate');
      } else {
        await axios.post('http://localhost:5000/api/schedules', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Jadwal berhasil ditambahkan');
      }
      setFormData({ id: null, teacher: '', classId: '', subject: '', dayOfWeek: 'Senin', startTime: '', endTime: '' });
      setIsEditing(false);
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
      endTime: sched.endTime
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus jadwal ini?')) {
      try {
        await axios.delete(`http://localhost:5000/api/schedules/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Jadwal berhasil dihapus');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Gagal menghapus jadwal');
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col z-10 shrink-0">
        <div className="px-6 py-8 border-b border-gray-100 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#183057] leading-tight">SMK Widya Utama</h1>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">Sistem Absensi</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
          >
            Dashboard
          </button>
          
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Akademik</div>
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-[#183057] bg-blue-50/50 rounded-md transition">
            Jadwal Pelajaran
          </button>
        </nav>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#183057] leading-tight">SMK Widya Utama</h1>
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

          <div className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-4">{isEditing ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Mata Pelajaran</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Matematika Dasar"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] p-2.5 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Pilih Kelas</label>
                <select 
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] p-2.5 transition"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.name} {c.major} ({c.academicYear})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Pilih Guru</label>
                <select 
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] p-2.5 transition"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Hari</label>
                <select 
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] p-2.5 transition"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Jam Mulai</label>
                  <input 
                    type="time" 
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] p-2.5 transition"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Jam Selesai</label>
                  <input 
                    type="time" 
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] p-2.5 transition"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ id: null, teacher: '', classId: '', subject: '', dayOfWeek: 'Senin', startTime: '', endTime: '' });
                    }}
                    className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-md transition"
                  >
                    Batal
                  </button>
                )}
                <button 
                  type="submit" 
                  className="text-xs font-bold text-white bg-[#183057] hover:bg-[#112240] px-6 py-2.5 rounded-md transition"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                </button>
              </div>

            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">Daftar Jadwal</h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{schedules.length} Jadwal</span>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#183057]"></div>
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
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Guru</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedules.map((sched) => (
                      <tr key={sched._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="font-bold text-[#183057]">{sched.dayOfWeek}</span>
                          <div className="text-xs text-gray-500">{sched.startTime} - {sched.endTime}</div>
                        </td>
                        <td className="px-5 py-3">
                          {sched.classId ? `${sched.classId.name} ${sched.classId.major}` : <span className="text-red-500 text-xs">Deleted</span>}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-900">{sched.subject}</td>
                        <td className="px-5 py-3 text-xs">{sched.teacher?.name || '-'}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          <button 
                            onClick={() => handleEdit(sched)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-semibold mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(sched._id)}
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
    </div>
  );
}
