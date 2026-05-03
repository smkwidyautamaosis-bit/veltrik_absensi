import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

// Fungsi bantuan untuk base64 VAPID Key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user || !token) return;

    fetchNotifications();
    setupSocket();
    setupPushNotification();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setNotifications(res.data.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const setupSocket = () => {
    const socket = io(`${import.meta.env.VITE_API_URL}`);
    
    // Join room spesifik ke ID User
    socket.emit('join-room', user._id);

    socket.on('new-notification', (notif) => {
      // Update state dengan notifikasi baru di paling atas
      setNotifications(prev => [notif, ...prev]);
    });

    return () => socket.disconnect();
  };

  const setupPushNotification = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Meminta izin jika belum
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;
        } else if (Notification.permission === 'denied') {
          return;
        }

        // Cek apakah sudah subscribe
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          if (!publicVapidKey) {
            console.error('VITE_VAPID_PUBLIC_KEY belum di-set di frontend');
            return;
          }

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }

        // Kirim subscription ke backend
        await axios.post(`${import.meta.env.VITE_API_URL}/api/notifications/subscribe`, subscription, {
          headers: { Authorization: `Bearer ${token}`}
        });

      } catch (err) {
        console.error('Gagal setup push notification:', err);
      }
    }
  };

  const handleNotificationClick = async (notif) => {
    // Jika belum dibaca, tandai sudah dibaca
    if (!notif.isRead) {
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/${notif._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}`}
        });
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsOpen(false);
    
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-[#183057] transition bg-gray-100 hover:bg-gray-200 rounded-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
            <h3 className="text-sm font-bold text-gray-900">Notifikasi</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-[#183057] hover:underline"
              >
                Tandai Semua Dibaca
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500">Tidak ada notifikasi saat ini.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map(notif => (
                  <li 
                    key={notif._id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition flex items-start gap-3 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'warning' && <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>}
                      {notif.type === 'error' && <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>}
                      {notif.type === 'success' && <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>}
                      {notif.type === 'info' && <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notif.title}
                      </p>
                      <p className={`text-xs mt-1 ${!notif.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
