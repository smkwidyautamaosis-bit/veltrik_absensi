const webpush = require('web-push');
const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
let io; // Akan di-inject dari server.js

// Konfigurasi Web Push
webpush.setVapidDetails(
  'mailto:admin@smkwidyautama.sch.id', // Bisa diganti email sekolah
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const setSocketIo = (socketIoInstance) => {
  io = socketIoInstance;
};

// Fungsi Helper untuk Kirim Notifikasi (In-App + PWA Push)
const sendNotification = async ({ recipient, title, message, type = 'info', link = '', relatedData = {} }) => {
  try {
    // 1. Simpan ke Database
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      link,
      relatedData
    });

    // 2. Kirim Realtime via Socket.io (In-App)
    if (io) {
      // Mengirim ke room khusus user (ID user)
      io.to(recipient.toString()).emit('new-notification', notification);
    }

    // 3. Kirim PWA Push Notification (jika user subscribe)
    const subscriptions = await PushSubscription.find({ user: recipient });
    
    if (subscriptions.length > 0) {
      const payload = JSON.stringify({
        title,
        body: message,
        icon: '/logo.png', // Logo sekolah
        data: { url: link } // URL tujuan saat notif diklik
      });

      const pushPromises = subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription, payload).catch(err => {
          console.error('Error send web push (mungkin unsubscribe):', err);
          // Jika error 410 (Gone), hapus dari DB
          if (err.statusCode === 410) {
            return PushSubscription.deleteOne({ _id: sub._id });
          }
        })
      );
      await Promise.all(pushPromises);
    }

    return notification;
  } catch (error) {
    console.error('Error di sendNotification:', error);
  }
};

module.exports = {
  setSocketIo,
  sendNotification
};
