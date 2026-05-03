import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ParentManagement() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  
  // Link State
  const [students, setStudents] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');
  
  useEffect(() => {
    fetchParents();
    fetchAllStudents(); // Untuk dropdown tautkan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchParents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parents`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setParents(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=siswa`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setStudents(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openParentModal = async (parent) => {
    setSelectedParent(parent);
    setShowModal(true);
    setSearchStudent('');
    
    setChildrenLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parents/${parent._id}/children`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setChildren(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data anak');
    } finally {
      setChildrenLoading(false);
    }
  };

  const handleLinkStudent = async (studentId, studentName) => {
    if (!window.confirm(`Apakah Anda yakin ingin menautkan ${studentName} ke akun orang tua ${selectedParent.name}?`)) {
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/parents/${selectedParent._id}/link-student`, { studentId }, {
        headers: { Authorization: `Bearer ${token}`}
      });
      alert('Siswa berhasil ditautkan!');
      // Refresh anak
      openParentModal(selectedParent);
      // Refresh students (in case they were linked to someone else)
      fetchAllStudents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menautkan siswa');
    }
  };

  const handleUnlinkStudent = async (studentId, studentName) => {
    if (!window.confirm(`Apakah Anda yakin ingin melepas tautan ${studentName}?`)) {
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/parents/${selectedParent._id}/unlink-student`, { studentId }, {
        headers: { Authorization: `Bearer ${token}`}
      });
      alert('Tautan siswa berhasil dilepas!');
      // Refresh
      openParentModal(selectedParent);
      fetchAllStudents();
    } catch (err) {
      console.error(err);
      alert('Gagal melepas tautan siswa');
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) || 
    (s.nisn && s.nisn.includes(searchStudent))
  ).slice(0, 5); // Limit 5 hasil pencarian

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#183057]">Manajemen Orang Tua</h2>
          <p className="text-sm text-gray-500">Kelola akun orang tua dan tautkan ke siswa</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Nama Orang Tua</th>
                <th className="px-6 py-4">Kontak</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parents.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                  <td className="px-6 py-4">{p.phoneNumber}</td>
                  <td className="px-6 py-4 text-gray-500">{p.email}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => openParentModal(p)}
                      className="bg-[#183057] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#0f1d35] transition"
                    >
                      Kelola Anak
                    </button>
                  </td>
                </tr>
              ))}
              {parents.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                    Belum ada akun orang tua. Buat akun di halaman Master Data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Kelola Anak */}
      {showModal && selectedParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kelola Anak: {selectedParent.name}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              
              {/* Daftar Anak yang Tertaut */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Anak yang Tertaut</h4>
                {childrenLoading ? (
                  <p className="text-sm text-gray-500">Memuat...</p>
                ) : children.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-5 text-center">
                    <p className="text-sm text-gray-500">Belum ada anak yang ditautkan ke akun ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {children.map(child => (
                      <div key={child._id} className="flex justify-between items-center border border-gray-200 rounded-lg p-3 bg-white">
                        <div>
                          <p className="font-bold text-gray-900">{child.name}</p>
                          <p className="text-xs text-gray-500">Kelas: {child.classId ? child.classId.name : '-'} | NISN: {child.nisn}</p>
                        </div>
                        <button 
                          onClick={() => handleUnlinkStudent(child._id, child.name)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition"
                        >
                          Lepas Tautan
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Tautkan Siswa Baru */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Tautkan Siswa Baru</h4>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Cari nama siswa atau NISN..." 
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#183057] focus:border-[#183057]"
                  />
                  {searchStudent && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-10">
                      {filteredStudents.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                          {filteredStudents.map(student => {
                            const isLinkedToThis = student.parentId === selectedParent._id;
                            const isLinkedToOther = student.parentId && student.parentId !== selectedParent._id;
                            return (
                              <li key={student._id} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                  <p className="text-xs text-gray-500">Kelas: {student.classId?.name || '-'} {isLinkedToOther && '(Sudah tertaut ortu lain)'}</p>
                                </div>
                                <button 
                                  disabled={isLinkedToThis}
                                  onClick={() => handleLinkStudent(student._id, student.name)}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-md transition ${isLinkedToThis ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#183057] text-white hover:bg-[#0f1d35]'}`}
                                >
                                  {isLinkedToThis ? 'Tertaut' : 'Tautkan'}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="p-3 text-sm text-gray-500 text-center">Siswa tidak ditemukan</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
