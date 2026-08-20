const jwt = require('jsonwebtoken');
const { Kullanici } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ hata: 'Yetkilendirme tokeni gerekli' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const kullanici = await Kullanici.findByPk(decoded.id);

    if (!kullanici || kullanici.durum !== 'aktif') {
      return res.status(401).json({ hata: 'Gecersiz veya pasif kullanici' });
    }

    req.kullanici = kullanici;
    req.kullaniciId = decoded.id;
    req.rol = decoded.rol;
    next();
  } catch (hata) {
    res.status(401).json({ hata: 'Token gecersiz' });
  }
};

const yetki = (...roller) => {
  return (req, res, next) => {
    if (!roller.includes(req.rol)) {
      return res.status(403).json({ hata: 'Bu islem icin yetkiniz yok' });
    }
    next();
  };
};

module.exports = { auth, yetki };
