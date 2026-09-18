self.addEventListener('install', (e) => {
    console.log('[Service Worker] ติดตั้งสำเร็จ พร้อมสำหรับการทำ PWA');
});

self.addEventListener('fetch', (e) => {
    // ปล่อยให้ระบบดึงข้อมูลออนไลน์ตามปกติ (เพื่อให้ Supabase ทำงานได้แบบ Realtime)
});