 

const CONFIG = {
    updateInterval: 2000, 
    maxUsers: 50000,
    apiEndpoint: '/api', 
    encryptionEnabled: true,
    sessionTimeout: 1800000 
};


function hashPassword(password) {
    // In production, use bcrypt or similar
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hashed_' + Math.abs(hash).toString(16);
}

function generateSessionToken() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// Users storage (use localStorage so registration persists)
// ============================================
let users = JSON.parse(localStorage.getItem('users')) || {
    'passenger1': { password: hashPassword('pass123'), type: 'passenger', name: 'راكب تجريبي' },
    'staff1': { password: hashPassword('staff123'), type: 'staff', name: 'موظف تجريبي' },
    'security1': { password: hashPassword('security123'), type: 'security', name: 'أمن تجريبي' }
};

function saveUsers() {
    try {
        localStorage.setItem('users', JSON.stringify(users));
    } catch (e) {
        console.warn('Cannot save users to localStorage:', e);
    }
}


let userSession = {
    isLoggedIn: false,
    userType: null, // 'passenger', 'staff', 'security'
    username: null,
    sessionToken: null,
    lastActivity: Date.now()
};

function validateSession() {
    if (!userSession.isLoggedIn) return false;
    const currentTime = Date.now();
    if (currentTime - userSession.lastActivity > CONFIG.sessionTimeout) {
        logoutUser();
        alert('انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.');
        return false;
    }
    userSession.lastActivity = currentTime;
    return true;
}

const auditLog = [];

function logAuditEvent(eventType, username, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        eventType: eventType,
        username: username || 'anonymous',
        ipAddress: '192.168.1.1', // Simulated
        details: details
    };
    auditLog.push(logEntry);
    console.log('🔒 Audit Log:', logEntry);
    // In production, send to secure backend
    // sendToAuditServer(encryptData(logEntry));
}

let sensorData = {
    trainArrivals: [],
    crowdDensity: [],
    environmentalData: {},
    equipmentStatus: {},
    securityAlerts: []
};

// ============================================
// Authentication System
// ============================================

// Login function
function loginUser(username, password) {
    const hashedPassword = hashPassword(password);
    if (users[username] && users[username].password === hashedPassword) {
        userSession.isLoggedIn = true;
        userSession.username = username;
        userSession.userType = users[username].type;
        userSession.sessionToken = generateSessionToken();
        userSession.lastActivity = Date.now();
        logAuditEvent('LOGIN_SUCCESS', username);
        return true;
    }
    logAuditEvent('LOGIN_FAILED', username);
    return false;
}

// Logout function (reset session and UI)
function logoutUser() {
    if (userSession && userSession.isLoggedIn) {
        logAuditEvent('LOGOUT', userSession.username);
        console.log(`👋 تسجيل خروج: ${userSession.username}`);
    }

    userSession = {
        isLoggedIn: false,
        userType: null,
        username: null,
        sessionToken: null,
        lastActivity: Date.now()
    };

    // Hide staff/security dashboards if exist
    const iot = document.getElementById('iot-dashboard');
    const sec = document.getElementById('security-dashboard');
    if (iot) iot.style.display = 'none';
    if (sec) sec.style.display = 'none';

    // Hide logout button and remove user indicator
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';
    const userIndicator = document.getElementById('user-indicator');
    if (userIndicator) userIndicator.remove();

    alert('تم تسجيل الخروج بنجاح ✅');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// IoT Data Simulation
// ============================================
const stations = [
    { id: 'olaya', name: 'العليا', line: 'red' },
    { id: 'king-abdullah', name: 'الملك عبدالله', line: 'blue' },
    { id: 'qasr-alhukm', name: 'قصر الحكم', line: 'green' },
    { id: 'airport', name: 'المطار', line: 'red' },
    { id: 'diriyah', name: 'الدرعية', line: 'green' },
    { id: 'malaz', name: 'الملز', line: 'blue' },
    { id: 'murabba', name: 'المربع', line: 'yellow' },
    { id: 'nakhil', name: 'النخيل', line: 'purple' }
];

function generateTrainData() {
    const lines = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const destinations = ['الملك عبدالله', 'المطار', 'الدرعية', 'العليا', 'قصر الحكم', 'النخيل'];
    const statuses = ['ontime', 'ontime', 'ontime', 'delayed', 'arriving'];
    sensorData.trainArrivals = [];
    for (let i = 0; i < 6; i++) {
        const minutesAway = Math.floor(Math.random() * 15) + 1;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        sensorData.trainArrivals.push({
            id: `train_${i}`,
            line: lines[i],
            destination: destinations[i],
            arrivalTime: `${minutesAway} دقيقة`,
            status: status,
            crowdLevel: Math.floor(Math.random() * 100)
        });
    }
}

function generateCrowdData() {
    sensorData.crowdDensity = stations.map(station => {
        const level = Math.floor(Math.random() * 100);
        let category;
        if (level < 30) category = 'low';
        else if (level < 70) category = 'medium';
        else category = 'high';
        return {
            stationId: station.id,
            stationName: station.name,
            line: station.line,
            level: level,
            category: category,
            capacity: 500,
            currentCount: Math.floor((level / 100) * 500)
        };
    });
}

function generateEnvironmentalData() {
    sensorData.environmentalData = {
        temperature: (22 + Math.random() * 6).toFixed(1),
        humidity: (40 + Math.random() * 20).toFixed(0),
        airQuality: 'جيد',
        co2Level: (400 + Math.random() * 200).toFixed(0)
    };
}

function generateEquipmentData() {
    const equipment = ['escalators', 'elevators', 'gates', 'displays'];
    sensorData.equipmentStatus = equipment.reduce((acc, item) => {
        acc[item] = { total: Math.floor(Math.random() * 30) + 20, operational: null };
        acc[item].operational = acc[item].total - Math.floor(Math.random() * 3);
        return acc;
    }, {});
}

// ============================================
// UI Update Functions
// ============================================
function getLineName(line) {
    const lineNames = {
        'red': 'الأحمر',
        'blue': 'الأزرق',
        'green': 'الأخضر',
        'yellow': 'الأصفر',
        'purple': 'البنفسجي',
        'orange': 'البرتقالي'
    };
    return lineNames[line] || line;
}

function updateTrainSchedule() {
    const trainList = document.getElementById('train-list');
    if (!trainList) {
        console.log('Train list element not found');
        return;
    }
    trainList.innerHTML = '';
    if (sensorData.trainArrivals.length === 0) {
        trainList.innerHTML = '<div class="train-item" style="grid-column: 1/-1; text-align: center;">لا توجد بيانات متاحة حالياً</div>';
        return;
    }
    sensorData.trainArrivals.forEach((train, index) => {
        const trainItem = document.createElement('div');
        trainItem.className = 'train-item fade-in';
        trainItem.style.animationDelay = `${index * 0.1}s`;
        let statusText = '';
        let statusClass = '';
        switch (train.status) {
            case 'ontime':
                statusText = 'في الموعد';
                statusClass = 'status-ontime';
                break;
            case 'delayed':
                statusText = 'متأخر';
                statusClass = 'status-delayed';
                break;
            case 'arriving':
                statusText = 'قادم';
                statusClass = 'status-arriving';
                break;
            default:
                statusText = 'في الموعد';
                statusClass = 'status-ontime';
        }
        trainItem.innerHTML = `
            <span class="train-line line-${train.line}">${getLineName(train.line)}</span>
            <span>${train.destination}</span>
            <span>${train.arrivalTime}</span>
            <span class="train-status ${statusClass}">${statusText}</span>
        `;
        trainList.appendChild(trainItem);
    });
    updateLastRefreshTime();
}

function updateCrowdDisplay() {
    const crowdGrid = document.getElementById('crowd-grid');
    if (!crowdGrid) {
        console.log('Crowd grid element not found');
        return;
    }
    crowdGrid.innerHTML = '';
    if (sensorData.crowdDensity.length === 0) {
        crowdGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">لا توجد بيانات متاحة حالياً</div>';
        return;
    }
    sensorData.crowdDensity.forEach((station, index) => {
        const crowdCard = document.createElement('div');
        crowdCard.className = 'crowd-card fade-in';
        crowdCard.dataset.line = station.line;
        crowdCard.style.animationDelay = `${index * 0.1}s`;
        crowdCard.innerHTML = `
            <h3>${station.stationName}</h3>
            <div class="crowd-bar">
                <div class="crowd-level crowd-${station.category}" style="width: ${station.level}%">
                    ${station.level}%
                </div>
            </div>
            <div class="crowd-info">
                <span>الحالة: ${getCrowdText(station.category)}</span>
                <span>${station.currentCount}/${station.capacity}</span>
            </div>
        `;
        crowdGrid.appendChild(crowdCard);
    });
}

function getCrowdText(category) {
    const texts = { 'low': 'منخفضة', 'medium': 'متوسطة', 'high': 'عالية' };
    return texts[category];
}

function addNotification(type, title, message, time) {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) return;
    const notification = document.createElement('div');
    notification.className = `notification-item ${type} fade-in`;
    const icon = type === 'warning' ? 'fa-exclamation-triangle' : type === 'danger' ? 'fa-times-circle' : 'fa-info-circle';
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">
                <i class="fas ${icon}"></i>
                ${title}
            </span>
            <span class="notification-time">${time}</span>
        </div>
        <p>${message}</p>
    `;
    notificationsList.appendChild(notification);
}

function updateNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) return;
    const delayedTrains = sensorData.trainArrivals.filter(train => train.status === 'delayed');
    const highCrowdStations = sensorData.crowdDensity.filter(station => station.category === 'high');
    notificationsList.innerHTML = '';
    delayedTrains.forEach(train => {
        addNotification('warning', 'تأخير في القطار', `القطار ${getLineName(train.line)} المتجه إلى ${train.destination} متأخر`, 'منذ 5 دقائق');
    });
    if (highCrowdStations.length > 0) {
        addNotification('warning', 'ازدحام في المحطات', `${highCrowdStations.length} محطة تشهد ازدحاماً عالياً`, 'منذ دقيقة');
    }
    addNotification('info', 'النظام يعمل بشكل طبيعي', 'جميع أنظمة IoT متصلة وتعمل بكفاءة', 'قبل ثانيتين');
}

function updateLiveUsers() {
    const liveUsers = document.getElementById('live-users');
    if (liveUsers) {
        const currentCount = parseInt(liveUsers.textContent.replace(/,/g, '')) || 1000;
        const newCount = currentCount + Math.floor(Math.random() * 20) - 10;
        liveUsers.textContent = Math.max(1000, newCount).toLocaleString('ar-SA');
    }
}

function updateLastRefreshTime() {
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        lastUpdate.textContent = 'قبل ثانيتين';
    }
}

function updateIoTDashboard() {
    if (userSession.userType !== 'staff') return;
    const sensorCards = document.querySelectorAll('.sensor-card .sensor-value');
    if (sensorCards[0]) sensorCards[0].textContent = Math.floor(Math.random() * 2000) + 1000;
    if (sensorCards[1]) sensorCards[1].textContent = sensorData.environmentalData.temperature + '°C';
    if (sensorCards[2]) {
        const esc = sensorData.equipmentStatus.escalators || { total: 1, operational: 1 };
        const operationalPercentage = Math.floor((esc.operational / esc.total) * 100);
        sensorCards[2].textContent = operationalPercentage + '%';
    }
    if (sensorCards[3]) sensorCards[3].textContent = stations.length;
    updateMaintenanceAlerts();
}

function updateMaintenanceAlerts() {
    const maintenanceList = document.getElementById('maintenance-list');
    if (!maintenanceList) return;
    const alerts = [
        { title: 'السلم المتحرك 12 - محطة العليا', description: 'اهتزاز غير طبيعي مكتشف. يوصى بالفحص خلال 48 ساعة', priority: 'medium' },
        { title: 'نظام التكييف - محطة المطار', description: 'ارتفاع طفيف في درجة الحرارة. الصيانة الوقائية مطلوبة', priority: 'low' }
    ];
    maintenanceList.innerHTML = '';
    alerts.forEach(alert => {
        const alertItem = document.createElement('div');
        alertItem.className = 'maintenance-item fade-in';
        alertItem.innerHTML = `
            <h4>${alert.title}</h4>
            <p>${alert.description}</p>
            <span class="maintenance-priority priority-${alert.priority}">
                أولوية: ${getPriorityText(alert.priority)}
            </span>
        `;
        maintenanceList.appendChild(alertItem);
    });
}

function getPriorityText(priority) {
    const texts = { 'high': 'عالية', 'medium': 'متوسطة', 'low': 'منخفضة' };
    return texts[priority];
}

// ============================================
// Security monitoring (security-dashboard)
// ============================================
function updateSecurityDashboard() {
    const securityAlertsContainer = document.getElementById('security-alerts');
    if (!securityAlertsContainer) return;
    if (!sensorData.securityAlerts || sensorData.securityAlerts.length === 0) {
        securityAlertsContainer.innerHTML = '<p class="no-alerts">لا توجد تنبيهات حالياً</p>';
        return;
    }
    securityAlertsContainer.innerHTML = '';
    sensorData.securityAlerts.forEach(alert => {
        const div = document.createElement('div');
        div.className = 'security-alert fade-in';
        div.style.cssText = 'background: #fff3cd; border-left: 5px solid #ff9800; padding: 12px; margin: 8px 0; border-radius: 8px; font-size: 0.95rem;';
        div.innerHTML = `<strong>${alert.title}</strong><br><span>مستوى الخطورة: ${alert.level}</span><br><small>${alert.time}</small>`;
        securityAlertsContainer.appendChild(div);
    });
}

function generateSecurityAlerts() {
    const alerts = [
        { title: '🚨 اشتباه بحركة غير طبيعية عند بوابة المحطة 3', level: 'عالية' },
        { title: '⚠️ ارتفاع درجة الحرارة في محطة العليا', level: 'متوسطة' },
        { title: '🔒 تم إغلاق بوابة المحطة مؤقتًا لأسباب أمنية', level: 'منخفضة' },
        { title: '📷 الكاميرا رقم 2 اكتشفت ازدحامًا مفاجئًا', level: 'متوسطة' },
        { title: '🚨 إنذار طوارئ - ضغط زر الإنذار في محطة المطار', level: 'عالية' },
        { title: '🛑 توقف مؤقت في نظام المراقبة بكاميرا 5', level: 'منخفضة' },
        { title: '🔔 اكتشاف صوت غير معتاد في محطة قصر الحكم', level: 'متوسطة' }
    ];
    const randomCount = Math.floor(Math.random() * 3) + 1;
    sensorData.securityAlerts = [];
    for (let i = 0; i < randomCount; i++) {
        const a = alerts[Math.floor(Math.random() * alerts.length)];
        sensorData.securityAlerts.push({ title: a.title, level: a.level, time: `قبل ${Math.floor(Math.random() * 5) + 1} دقيقة` });
    }
    updateSecurityDashboard();
}

function initSecuritySurveillance() {
    if (userSession.userType === 'security') {
        console.log('🛡️ تفعيل نظام المراقبة الأمنية...');
        generateSecurityAlerts();
        updateSecurityDashboard();
        setInterval(generateSecurityAlerts, 60000);
    }
}

// ============================================
// Utilities
// ============================================
function getUserTypeArabic(type) {
    switch (type) {
        case 'passenger': return 'راكب';
        case 'staff': return 'موظف';
        case 'security': return 'أمن';
        default: return 'غير معروف';
    }
}

function getPaymentMethodName(method) {
    const names = { 'nfc': 'NFC الهاتف الذكي', 'smartcard': 'البطاقة الذكية', 'biometric': 'الدفع البيومتري', 'qr': 'رموز QR' };
    return names[method] || method;
}

function getSystemPerformance() {
    return {
        responseTime: Math.random() * 2,
        availability: 99.9,
        activeUsers: parseInt(document.getElementById('live-users')?.textContent.replace(/,/g, '') || 1000),
        encryptionStatus: true
    };
}

function exportAuditLogs() {
    if (userSession.userType !== 'staff' && userSession.userType !== 'security') {
        alert('غير مصرح لك بتصدير السجلات');
        return;
    }
    const logs = JSON.stringify(auditLog);
    console.log('Encrypted Audit Logs (sim):', logs);
    alert('تم تصدير سجلات التدقيق بنجاح (مشفرة)');
}

// ============================================
// DOM Ready & Event wiring (single place)
// ============================================
window.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 نظام مترو الرياض الذكي جاهز!');

    // Initialize data once
    generateTrainData();
    generateCrowdData();
    generateEnvironmentalData();
    generateEquipmentData();

    // Initial UI updates
    updateTrainSchedule();
    updateCrowdDisplay();
    updateNotifications();

    // Navigation setup
    setupNavigation();

    // Station selector
    const stationSelect = document.getElementById('station-select');
    if (stationSelect) {
        stationSelect.addEventListener('change', function () {
            generateTrainData();
            updateTrainSchedule();
        });
    }

    // Crowd filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const line = this.dataset.line;
            filterCrowdData(line);
        });
    });

    // Staff login hint button
    const staffLoginBtn = document.getElementById('staff-login-btn');
    if (staffLoginBtn) {
        staffLoginBtn.addEventListener('click', function () {
            alert('للموظفين: استخدم staff1 / staff123\nللأمن: استخدم security1 / security123');
        });
    }

    // Payment method selection
    const paymentCards = document.querySelectorAll('.payment-card');
    paymentCards.forEach(card => {
        const btn = card.querySelector('.btn-primary');
        if (btn) {
            btn.addEventListener('click', function () {
                const method = card.dataset.method;
                alert(`تم اختيار طريقة الدفع: ${getPaymentMethodName(method)}`);
                logAuditEvent('PAYMENT_METHOD_SELECTED', userSession.username, { method });
            });
        }
    });

    // Notification toggle
    const delayAlerts = document.getElementById('delay-alerts');
    if (delayAlerts) {
        delayAlerts.addEventListener('change', function () {
            if (this.checked) alert('تم تفعيل إشعارات التأخير');
            else alert('تم إيقاف إشعارات التأخير');
        });
    }

    // Start real-time updates
    setInterval(() => {
        generateTrainData();
        generateCrowdData();
        generateEnvironmentalData();
        generateEquipmentData();

        updateTrainSchedule();
        updateCrowdDisplay();
        updateNotifications();
        updateLiveUsers();

        if (userSession.userType === 'staff') updateIoTDashboard();

        if (userSession.isLoggedIn) validateSession();
    }, CONFIG.updateInterval);

    // Session activity tracker
    document.addEventListener('click', () => {
        if (userSession.isLoggedIn) userSession.lastActivity = Date.now();
    });

    // Register modal wiring
    const registerLink = document.querySelector('.register-link');
    const registerModal = document.getElementById('register-modal');
    const closeRegister = document.getElementById('close-register');
    const registerForm = document.getElementById('register-form');
    const userTypeSelect = document.getElementById('new-type');
    const verificationGroup = document.getElementById('verification-code-group');
    const verificationInput = document.getElementById('verification-code');

    if (registerLink) {
        registerLink.addEventListener('click', function (e) {
            e.preventDefault();
            if (registerModal) registerModal.style.display = 'block';
        });
    }
    if (closeRegister) {
        closeRegister.addEventListener('click', function () {
            if (registerModal) registerModal.style.display = 'none';
        });
    }
    if (userTypeSelect && verificationGroup && verificationInput) {
        userTypeSelect.addEventListener('change', function () {
            if (this.value === 'staff' || this.value === 'security') verificationGroup.style.display = 'block';
            else { verificationGroup.style.display = 'none'; verificationInput.value = ''; }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const newUsernameRaw = document.getElementById('new-username')?.value || '';
            const newPassword = document.getElementById('new-password')?.value || '';
            const newType = document.getElementById('new-type')?.value || 'passenger';
            const enteredCode = document.getElementById('verification-code')?.value || '';

            const newUsername = newUsernameRaw.trim().toLowerCase();

            if (!newUsername || !newPassword || !newType) {
                alert('⚠️ الرجاء إدخال جميع البيانات المطلوبة.');
                return;
            }
            if (users[newUsername]) {
                alert('🚫 اسم المستخدم موجود مسبقاً!');
                return;
            }
            if ((newType === 'staff' || newType === 'security') && enteredCode !== '1234') {
                alert('❌ رمز التحقق غير صحيح. الرجاء التواصل مع الإدارة.');
                return;
            }

            users[newUsername] = { password: hashPassword(newPassword), type: newType, name: newUsername };
            saveUsers();
            alert(`✅ تم إنشاء الحساب بنجاح كـ ${getUserTypeArabic(newType)}! يمكنك الآن تسجيل الدخول.`);
            registerForm.reset();
            if (verificationGroup) verificationGroup.style.display = 'none';
            if (registerModal) registerModal.style.display = 'none';
        });
    }

    // Login form wiring (single correct handler)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = document.getElementById('username')?.value.trim().toLowerCase() || '';
            const password = document.getElementById('password')?.value.trim() || '';
            const selectedType = document.getElementById('user-type')?.value || '';

            if (!username || !password || !selectedType) {
                alert('⚠️ الرجاء إدخال البيانات كاملة.');
                return;
            }
            if (!users[username]) {
                alert('❌ اسم المستخدم غير موجود.');
                return;
            }
            const actualType = users[username].type;
            if (selectedType !== actualType) {
                alert(`🚫 نوع الحساب غير مطابق! الحساب الحقيقي هو: ${getUserTypeArabic(actualType)}.`);
                return;
            }
            if (loginUser(username, password)) {
                alert(`✅ مرحباً ${users[username].name}! تم تسجيل الدخول بنجاح.`);
                updateUIAfterLogin();
                // Show dashboards depending on role
                if (userSession.userType === 'staff') {
                    const dash = document.getElementById('iot-dashboard');
                    if (dash) { dash.style.display = 'block'; updateIoTDashboard(); dash.scrollIntoView({behavior:'smooth'}); }
                } else if (userSession.userType === 'security') {
                    const sd = document.getElementById('security-dashboard');
                    if (sd) { sd.style.display = 'block'; initSecuritySurveillance(); sd.scrollIntoView({behavior:'smooth'}); }
                }
                loginForm.reset();
            } else {
                alert('❌ كلمة المرور غير صحيحة.');
            }
        });
    }

    // Logout button wiring (always registered)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
        // hide by default; will be shown after successful login
        logoutBtn.style.display = 'none';
    }

    // Ensure train schedule renders even if something else failed
    (function ensureTrainDataAndRender() {
        const trainListEl = document.getElementById('train-list');
        if (!trainListEl) {
            console.warn('🚨 عنصر #train-list غير موجود في HTML. تأكدي من وجود <div id="train-list"></div>');
            return;
        }
        if (typeof generateTrainData === 'function') generateTrainData();
        if (typeof updateTrainSchedule === 'function') updateTrainSchedule();
    })();

}); // end DOMContentLoaded

// ============================================
// Navigation & helpers outside DOMContentLoaded
// ============================================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                const targetSection = document.querySelector(href);
                if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    window.addEventListener('scroll', function () {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 100) current = section.getAttribute('id');
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) link.classList.add('active');
        });
    });
}

function filterCrowdData(line) {
    const crowdCards = document.querySelectorAll('.crowd-card');
    crowdCards.forEach(card => {
        if (line === 'all' || card.dataset.line === line) card.style.display = 'block';
        else card.style.display = 'none';
    });
}

// ============================================
// Final debug / monitoring
// ============================================
console.log('%c🔐 معلومات تسجيل الدخول للاختبار:', 'color: blue; font-size: 14px; font-weight: bold');
console.log('راكب: passenger1 / pass123');
console.log('موظف: staff1 / staff123');
console.log('أمن: security1 / security123');

setInterval(() => {
    const perf = getSystemPerformance();
    console.log(`زمن الاستجابة: ${perf.responseTime.toFixed(3)}s | التوفر: ${perf.availability}%`);
}, 10000);

// expose metroSystem for console testing
window.metroSystem = {
    login: loginUser,
    logout: logoutUser,
    getSession: () => userSession,
    getSensorData: () => sensorData,
    exportLogs: exportAuditLogs
};
// ============================================
// واجهة المستخدم بعد تسجيل الدخول
// ============================================
function updateUIAfterLogin() {

    // إظهار اسم المستخدم في الهيدر
    const navbar = document.querySelector('.navbar');
    if (navbar && userSession.isLoggedIn) {
        let indicator = document.getElementById('user-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'user-indicator';
            indicator.style.cssText = `
                position: absolute;
                top: 10px;
                left: 20px;
                background: #34a853;
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 14px;
            `;
            navbar.appendChild(indicator);
        }
        indicator.innerHTML = `✓ متصل: ${users[userSession.username].name}`;
    }

    // أول شي نخفي جميع الداشبورد
    const iotDashboard = document.getElementById('iot-dashboard');
    const securityDashboard = document.getElementById('security-dashboard');

    if (iotDashboard) iotDashboard.style.display = 'none';
    if (securityDashboard) securityDashboard.style.display = 'none';

    // حسب نوع المستخدم
    if (userSession.userType === 'staff') {
        if (iotDashboard) {
            iotDashboard.style.display = 'block';
            updateIoTDashboard();
            iotDashboard.scrollIntoView({ behavior: 'smooth' });
        }
    }

    if (userSession.userType === 'security') {
        if (securityDashboard) {
            securityDashboard.style.display = 'block';
            initSecuritySurveillance();
            securityDashboard.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
}

