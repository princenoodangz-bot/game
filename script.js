// 1. ใส่ค่าการเชื่อมต่อ Supabase ของคุณ
const SUPABASE_URL = 'https://gtcjixepijvcgvyfpqws.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Y2ppeGVwaWp2Y2d2eWZwcXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MjU5NDYsImV4cCI6MjEwMTMwMTk0Nn0.FyEIl4r_LXhLeUxIzHusKzpnp7EdMvjADCdiLEMS-G8'; 

// เปลี่ยนชื่อตัวแปรเป็น supabaseClient เพื่อไม่ให้ชื่อชนกัน
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. ตรวจสอบสถานะการล็อกอินเมื่อโหลดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
});

function checkLoginStatus() {
    const studentData = localStorage.getItem('studentSession');
    if (studentData) {
        // ถ้าเคยล็อกอินแล้ว ให้ไปหน้า Dashboard เลย
        const student = JSON.parse(studentData);
        showDashboard(student);
    } else {
        // ถ้ายัง ให้โชว์หน้า Login
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
    }
}

// 3. ฟังก์ชันจัดการการล็อกอิน
async function handleLogin() {
    const studentCode = document.getElementById('student_code_input').value.trim();
    const errorMsg = document.getElementById('login-error');
    errorMsg.classList.add('hidden');

    if (!studentCode) return;

    try {
        // เปลี่ยนมาใช้ supabaseClient ในการดึงข้อมูล
        const { data: student, error } = await supabaseClient
            .from('students')
            .select('id, student_code, first_name, last_name, class_room')
            .eq('student_code', studentCode)
            .single();

        if (error || !student) {
            errorMsg.classList.remove('hidden');
        } else {
            // บันทึกข้อมูลนักเรียนลง Local Storage ของมือถือ
            localStorage.setItem('studentSession', JSON.stringify(student));
            showDashboard(student);
        }
    } catch (err) {
        console.error("Error logging in:", err);
        errorMsg.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อ";
        errorMsg.classList.remove('hidden');
    }
}

// 4. ฟังก์ชันแสดงหน้า Dashboard (อัปเดตใหม่)
function showDashboard(student) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    
    // แสดงชื่อและชั้นเรียนมุมขวาบน
    document.getElementById('student-name-display').textContent = 
        `${student.first_name} ${student.last_name} (${student.class_room})`;
        
    // เรียกฟังก์ชันโหลดรายชื่อเกม (เพิ่มบรรทัดนี้เข้ามา)
    loadGames();
}

// 5. ฟังก์ชันออกจากระบบ
function handleLogout() {
    localStorage.removeItem('studentSession');
    document.getElementById('student_code_input').value = '';
    checkLoginStatus();
}
// 6. ฟังก์ชันดึงข้อมูลเกมจาก Supabase มาแสดงผล
async function loadGames() {
    const gamesContainer = document.getElementById('games-container');
    gamesContainer.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">กำลังโหลดข้อมูลเกม...</p>';

    try {
        // ดึงเฉพาะเกมที่เปิดใช้งานอยู่ (is_active = true)
        const { data: games, error } = await supabaseClient
            .from('games')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        gamesContainer.innerHTML = ''; // ล้างข้อความกำลังโหลด

        // กรณีที่ยังไม่มีเกมในระบบ
        if (games.length === 0) {
            gamesContainer.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">ยังไม่มีมินิเกมในระบบตอนนี้ครับ</p>';
            return;
        }

        // วนลูปสร้างการ์ดเกมตามจำนวนที่ดึงมาได้
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = "bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-200 border border-gray-100 flex flex-col";
            
            // สร้างบล็อกรูปภาพหน้าปกแบบเรียบง่าย (แทนรูปจริง)
            const coverImage = `
                <div class="h-32 bg-blue-100 flex items-center justify-center text-blue-500 text-4xl">
                    🎮
                </div>
            `;

            // โครงสร้าง HTML ของการ์ด 1 ใบ
            card.innerHTML = `
                ${coverImage}
                <div class="p-4 flex-grow flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold text-lg text-gray-800 mb-1">${game.game_name}</h3>
                        <p class="text-sm text-gray-500 mb-4 line-clamp-2">${game.description || 'ไม่มีคำอธิบาย'}</p>
                    </div>
                    <button onclick="playGame('${game.id}', '${game.game_url}')" 
                            class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 shadow-sm">
                        เข้าเล่นเกม
                    </button>
                </div>
            `;
            gamesContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading games:", err);
        gamesContainer.innerHTML = '<p class="text-red-500 col-span-full text-center py-8">เกิดข้อผิดพลาดในการดึงข้อมูลเกม</p>';
    }
}

// 7. ฟังก์ชันเมื่อนักเรียนกดปุ่ม "เข้าเล่นเกม"
function playGame(gameId, gameUrl) {
    const student = JSON.parse(localStorage.getItem('studentSession'));
    
    // สร้าง URL ของเกม พร้อมแนบรหัสนักเรียนและรหัสเกมไปกับลิงก์
    const urlWithParams = `${gameUrl}?student_id=${student.id}&game_id=${gameId}`;
    
    // เปลี่ยนหน้าเว็บไปยังตัวเกม
    window.location.href = urlWithParams;
}