const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const { sequelize } = require('./models');

// Route importlari
const authRoutes = require('./routes/auth');
const kuryeRoutes = require('./routes/kurye');
const isletmeRoutes = require('./routes/isletme');
const siparisRoutes = require('./routes/siparis');
const adminRoutes = require('./routes/admin');
const haritaRoutes = require('./routes/harita');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Yeni baglanti:', socket.id);

  // Kurye odasina katil
  socket.on('kuryeKatil', (kuryeId) => {
    socket.join(`kurye_${kuryeId}`);
    console.log(`Kurye ${kuryeId} katildi`);
  });

  // Isletme odasina katil
  socket.on('isletmeKatil', (isletmeId) => {
    socket.join(`isletme_${isletmeId}`);
    console.log(`Isletme ${isletmeId} katildi`);
  });

  // Admin odasina katil
  socket.on('adminKatil', () => {
    socket.join('admin');
    console.log('Admin katildi');
  });

  // Konum guncelleme
  socket.on('konumGonder', (data) => {
    io.emit('kuryeKonumu', data);
  });

  // Siparis durum guncelleme
  socket.on('siparisDurum', (data) => {
    if (data.isletmeId) {
      io.to(`isletme_${data.isletmeId}`).emit('siparisDurumGuncelle', data);
    }
    if (data.kuryeId) {
      io.to(`kurye_${data.kuryeId}`).emit('siparisDurumGuncelle', data);
    }
    io.to('admin').emit('siparisDurumGuncelle', data);
  });

  socket.on('disconnect', () => {
    console.log('Baglanti kesildi:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Route'lar
app.use('/api/auth', authRoutes);
app.use('/api/kurye', kuryeRoutes);
app.use('/api/isletme', isletmeRoutes);
app.use('/api/siparis', siparisRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/harita', haritaRoutes);

// Saglik kontrolu
app.get('/api/health', (req, res) => {
  res.json({ durum: 'aktif', proje: 'Boran Mersin', versiyon: '1.0.0' });
});

// Hata yakalama
app.use((err, req, res, next) => {
  console.error('Sunucu hatasi:', err);
  res.status(500).json({ hata: 'Sunucu hatasi olustu' });
});

// Veritabani baglantisi ve sunucu baslatma
const PORT = process.env.PORT || 3000;

async function baslat() {
  try {
    await sequelize.authenticate();
    console.log('Veritabani baglandi');
    
    await sequelize.sync();
    console.log('Veritabani senkronize edildi');

    server.listen(PORT, () => {
      console.log(`Boran Mersin sunucu ${PORT} portunda calisiyor`);
    });
  } catch (hata) {
    console.error('Sunucu baslatma hatasi:', hata);
    process.exit(1);
  }
}

baslat();
