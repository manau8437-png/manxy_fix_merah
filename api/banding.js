// api/banding.js
const axios = require('axios');
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Hanya menerima request GET dari callApi bot kamu
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method tidak diizinkan' });
  }

  const { nomor, apikey } = req.query;

  // 1. Validasi API Key bawaan script bot kamu
  if (apikey !== 'adminv') {
    return res.status(403).json({ success: false, message: 'API Key tidak valid' });
  }

  if (!nomor) {
    return res.status(400).json({ success: false, message: 'Nomor WhatsApp tidak disertakan' });
  }

  // Konfigurasi GitHub untuk mengambil dataimel.txt
  const GITHUB_OWNER = "manau8437-png";
  const GITHUB_REPO = "manxy_fix_merah";
  const GITHUB_FILE = "dataimel.txt";

  try {
    // 2. Ambil daftar email pengirim dari GitHub dataimel.txt kamu
    const githubUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
    const githubRes = await axios.get(githubUrl);
    const content = Buffer.from(githubRes.data.content, 'base64').toString('utf8').trim();

    if (!content) {
      return res.status(500).json({ success: false, message: 'Daftar email di GitHub masih kosong. Isi dulu lewat /addemail' });
    }

    const emailLines = content.split('\n').filter(line => line.includes(':'));
    if (emailLines.length === 0) {
      return res.status(500).json({ success: false, message: 'Format email di GitHub tidak valid' });
    }

    // Ambil 1 email secara acak dari list (sistem rotasi biar ga gampang spam)
    const randomLine = emailLines[Math.floor(Math.random() * emailLines.length)];
    const [senderEmail, senderPassword] = randomLine.split(':');

    // 3. Konfigurasi Pesan Banding Sesuai Permintaanmu
    const waSupportEmail = 'support@support.whatsapp.com'; 
    const subjectBanding = 'Aju bamding nomor WhatsApp yang login tidak tersedia saat ini';
    
    // Pesan menggunakan template string agar variabel nomor masuk otomatis
    const pesanBanding = `Halo pihak WhatsApp mohon bantuannya saat ini saya tidak bisa login WhatsApp dengan No +${nomor}\n\nsaya tidak tahu penyebab nya apa tiba tiba saya di suruh login kembali saat saya login kembali dan muncul kembali tulisan login tidak tersedia untuk saat ini mohon bantuannya soalnya karena akun WhatsApp saya ini sangat penting untuk keluarga dan pekerjaan saya mohon bantuannya.\n\nTerimakasih.`;

    // 4. Konfigurasi SMTP Pengirim (Gmail App Password)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail.trim(),
        pass: senderPassword.trim() // Password aplikasi 16 digit dari gmail
      }
    });

    // 5. Kirim email langsung ke tujuan support WhatsApp
    await transporter.sendMail({
      from: senderEmail.trim(),
      to: waSupportEmail,
      subject: subjectBanding,
      text: pesanBanding
    });

    // Balasan sukses ke Telegram Bot kamu
    return res.status(200).json({
      success: true,
      status: '✅ Email Banding Terkirim',
      nomor: nomor,
      email: senderEmail.trim(),
      message: 'Sistem banding mandiri berhasil diproses!'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Gagal mengeksekusi sistem banding' 
    });
  }
}
