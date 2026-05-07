import { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '../components/AppSidebar';

export default function ParentManagement() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  // Modal Kelola Anak
  const [showModal, setShowModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

  // Modal Tambah Orang Tua
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phoneNumber: '', password: 'Masuk123' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Link State
  const [students, setStudents] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');

  // Children count cache
  const [childrenCounts, setChildrenCounts] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!showModal && !showAddModal && !deleteTarget) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        setShowAddModal(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal, showAddModal, deleteTarget]);

  useEffect(() => {
    fetchParents();
    fetchAllStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchParents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParents(res.data.data);

      // Fetch children counts
      const counts = {};
      for (const parent of res.data.data) {
        try {
          const childRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/parents/${parent._id}/children`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          counts[parent._id] = childRes.data.data.length;
        } catch {
          counts[parent._id] = 0;
        }
      }
      setChildrenCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=siswa`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // === TAMBAH ORANG TUA ===
  const handleAddParent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/parents`, addForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Akun orang tua berhasil dibuat!');
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phoneNumber: '', password: 'Masuk123' });
      fetchParents();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat akun orang tua');
    } finally {
      setIsSubmitting(false);
    }
  };

  // === HAPUS ORANG TUA ===
  const handleDeleteParent = async (parentId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/parents/${parentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Akun orang tua berhasil dihapus.');
      fetchParents();
      fetchAllStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus akun orang tua');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // === KELOLA ANAK ===
  const openParentModal = async (parent) => {
    setSelectedParent(parent);
    setShowModal(true);
    setSearchStudent('');
    
    setChildrenLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parents/${parent._id}/children`, {
        headers: { Authorization: `Bearer ${token}` }
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
    if (!window.confirm(`Tautkan ${studentName} ke ${selectedParent.name}?`)) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/parents/${selectedParent._id}/link-student`, { studentId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Siswa berhasil ditautkan!');
      openParentModal(selectedParent);
      fetchAllStudents();
      fetchParents();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menautkan siswa');
    }
  };

  const handleUnlinkStudent = async (studentId, studentName) => {
    if (!window.confirm(`Lepas tautan ${studentName}?`)) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/parents/${selectedParent._id}/unlink-student`, { studentId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Tautan siswa berhasil dilepas!');
      openParentModal(selectedParent);
      fetchAllStudents();
      fetchParents();
    } catch (err) {
      alert('Gagal melepas tautan siswa');
    }
  };

  // === EXPORT PDF ===
  const handleExportPDF = async () => {
    try {
      if (parents.length === 0) return alert('Tidak ada data orang tua');

      const doc = new jsPDF();

      // Header
      doc.setFontSize(16);
      doc.text('SMK WIDYA UTAMA', 105, 20, { align: 'center' });
      doc.setFontSize(13);
      doc.text('DAFTAR AKUN LOGIN ORANG TUA', 105, 30, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Tanggal cetak: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 42);

      // Prepare table data with children names
      const tableData = [];
      for (let i = 0; i < parents.length; i++) {
        const parent = parents[i];
        let childNames = '-';
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parents/${parent._id}/children`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.data.length > 0) {
            childNames = res.data.data.map(c => c.name).join(', ');
          }
        } catch {}
        tableData.push([
          i + 1,
          parent.name,
          parent.email,
          'Masuk123',
          parent.phoneNumber || '-',
          childNames
        ]);
      }

      autoTable(doc, {
        startY: 48,
        head: [['No', 'Nama Orang Tua', 'Email Login', 'Password', 'No HP', 'Nama Anak']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [128, 0, 0] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 10 },
          5: { cellWidth: 40 },
        },
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 150;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('* Password default: Masuk123. Harap ganti setelah login pertama.', 14, finalY + 10);
      doc.text('* Bagikan kredensial ini kepada orang tua melalui Wali Kelas.', 14, finalY + 16);

      doc.setFont('helvetica', 'normal');
      doc.text('Mengetahui,', 150, finalY + 28);
      doc.text('Tata Usaha', 150, finalY + 35);
      doc.text('(____________________)', 150, finalY + 55);

      doc.save('Daftar_Akun_Orang_Tua.pdf');
    } catch (err) {
      console.error('PDF Error:', err);
      alert('Gagal membuat PDF: ' + err.message);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) || 
    (s.nisn && s.nisn.includes(searchStudent))
  ).slice(0, 5);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-poppins text-gray-900 overflow-hidden">
      <AppSidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-gray-50">
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-maroon">Manajemen Orang Tua</h2>
          <p className="text-sm text-gray-400 mt-0.5">Kelola akun orang tua, tautkan ke siswa, dan export kredensial.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Akun PDF
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-maroon text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-maroon-dark transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Orang Tua
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 space-y-4">
            {[1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{ width: `${80 - i*10}%` }}></div>)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-400 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Nama Orang Tua</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">No HP</th>
                  <th className="px-5 py-3.5 text-center">Jumlah Anak</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parents.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900">{p.name}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{p.email}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{p.phoneNumber || '-'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${(childrenCounts[p._id] || 0) > 0 ? 'bg-maroon/10 text-maroon' : 'bg-gray-100 text-gray-400'}`}>
                        {childrenCounts[p._id] ?? '...'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openParentModal(p)}
                          className="bg-maroon/10 text-maroon px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-maroon/20 transition"
                        >
                          Kelola Anak
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(p)}
                          className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {parents.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center">
                      <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
                      <p className="text-sm text-gray-400 font-medium">Belum ada akun orang tua.</p>
                      <p className="text-xs text-gray-300 mt-1">Klik "Tambah Orang Tua" untuk membuat akun baru.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== MODAL TAMBAH ORANG TUA ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Tambah Orang Tua</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddParent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nama Lengkap *</label>
                <input type="text" required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition" 
                  placeholder="Nama lengkap orang tua" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email (Username Login) *</label>
                <input type="email" required value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition" 
                  placeholder="email@contoh.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">No HP / WhatsApp *</label>
                <input type="text" required value={addForm.phoneNumber} onChange={e => setAddForm({...addForm, phoneNumber: e.target.value})}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition" 
                  placeholder="08xxxxxxxxxx" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <input type="text" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition" />
                <p className="text-[10px] text-gray-400 mt-1">Default: Masuk123. Bisa diganti sesuai kebutuhan.</p>
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full bg-maroon hover:bg-maroon-dark text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Menyimpan...
                  </>
                ) : 'Simpan Akun Orang Tua'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL KELOLA ANAK ===== */}
      {showModal && selectedParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-bounce-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kelola Anak</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedParent.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Anak Tertaut */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Anak yang Tertaut</h4>
                {childrenLoading ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '12px' }}></div>)}
                  </div>
                ) : children.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <div className="text-3xl mb-2">👶</div>
                    <p className="text-sm text-gray-400 font-medium">Belum ada anak yang ditautkan.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {children.map(child => (
                      <div key={child._id} className="flex justify-between items-center border border-gray-100 rounded-xl p-3.5 bg-white hover:bg-gray-50/50 transition">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{child.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Kelas: {child.classId ? child.classId.name : '-'} · NISN: {child.nisn}</p>
                        </div>
                        <button 
                          onClick={() => handleUnlinkStudent(child._id, child.name)}
                          className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                        >
                          Lepas
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tautkan Siswa Baru */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Tautkan Siswa Baru</h4>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Cari nama siswa atau NISN..." 
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition"
                  />
                  {searchStudent && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-10">
                      {filteredStudents.length > 0 ? (
                        <ul className="divide-y divide-gray-50">
                          {filteredStudents.map(student => {
                            const isLinkedToThis = student.parentId === selectedParent._id;
                            const isLinkedToOther = student.parentId && student.parentId !== selectedParent._id;
                            return (
                              <li key={student._id} className="p-3 hover:bg-gray-50 flex justify-between items-center transition">
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                  <p className="text-xs text-gray-400">Kelas: {student.classId?.name || '-'} {isLinkedToOther && '(Sudah tertaut ortu lain)'}</p>
                                </div>
                                <button 
                                  disabled={isLinkedToThis}
                                  onClick={() => handleLinkStudent(student._id, student.name)}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${isLinkedToThis ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-maroon text-white hover:bg-maroon-dark'}`}
                                >
                                  {isLinkedToThis ? 'Tertaut' : 'Tautkan'}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="p-4 text-sm text-gray-400 text-center">Siswa tidak ditemukan</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white w-full max-w-sm rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold text-gray-900 mb-2">Konfirmasi Hapus</h4>
            <p className="text-sm text-gray-600 mb-4">Yakin ingin menghapus {deleteTarget.name}?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md bg-gray-100 text-sm font-semibold">Batal</button>
              <button onClick={async () => { await handleDeleteParent(deleteTarget._id); setDeleteTarget(null); }} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </main>
    </div>
  );
}
