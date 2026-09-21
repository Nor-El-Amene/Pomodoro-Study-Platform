// ========================================================
// ================= API HELPER ===========================
// ========================================================
const API = 'api/';

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const res = await fetch(API + endpoint, options);
        const data = await res.json();
        return data;
    } catch (err) {
        console.error('API Error:', err);
        return { success: false, message: 'Connection error' };
    }
}

// ========================================================
// ================= AUTH SYSTEM ==========================
// ========================================================
function getCurrentUser() {
    const user = localStorage.getItem('focusUser');
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('focusUser', JSON.stringify(user));
}

function logoutUser() {
    localStorage.removeItem('focusUser');
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function showAuthError(msg) {
    const el = document.getElementById('authError');
    const msgEl = document.getElementById('authErrorMsg');
    msgEl.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

function hideAuthError() {
    document.getElementById('authError').classList.add('hidden');
}

function updateAuthUI() {
    const user = getCurrentUser();
    const authBtn = document.getElementById('authBtn');
    const statsPrompt = document.getElementById('statsSigninPrompt');
    const statsContent = document.getElementById('statsContent');
    const statsWelcome = document.getElementById('statsWelcome');
    const statsUserName = document.getElementById('statsUserName');

    if (user) {
        authBtn.querySelector('i').className = 'fas fa-right-from-bracket';
        authBtn.querySelector('span').textContent = 'Sign Out';
        statsPrompt.classList.add('hidden');
        statsContent.classList.remove('hidden');
        statsWelcome.style.display = 'block';
        statsUserName.textContent = `Welcome back, ${user.name} ✨`;
    } else {
        authBtn.querySelector('i').className = 'fas fa-user';
        authBtn.querySelector('span').textContent = 'Sign In';
        statsPrompt.classList.remove('hidden');
        statsContent.classList.add('hidden');
    }
}

// ===== User study data cache =====
let userStudyData = {};

async function loadUserStudyData() {
    const user = getCurrentUser();
    if (!user) { userStudyData = {}; return; }

    const res = await apiCall(`get_stats.php?user_id=${user.id}`);
    if (res.success) {
        userStudyData = res.data;
    } else {
        userStudyData = {};
    }
}

function getUserData() {
    return userStudyData;
}

function todayKey() {
    return new Date().toISOString().split('T')[0];
}

async function recordSession(mins) {
    if (!isLoggedIn()) return;
    const user = getCurrentUser();

    const res = await apiCall('record_session.php', 'POST', {
        user_id: user.id,
        minutes: mins,
        date: todayKey()
    });

    if (res.success) {
        const k = todayKey();
        if (!userStudyData[k]) userStudyData[k] = { sessions: 0, minutes: 0 };
        userStudyData[k].sessions++;
        userStudyData[k].minutes += mins;
        updateStats();
    }
}

// ===== BACKGROUND SLIDESHOW =====
const slides = document.querySelectorAll('.bg-slide');
let curSlide = 0;
setInterval(() => {
    slides[curSlide].classList.remove('active');
    curSlide = (curSlide + 1) % slides.length;
    slides[curSlide].classList.add('active');
}, 14000);

// ===== NAVIGATION =====
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

function goToPage(pageId) {
    navItems.forEach(n => n.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    const navItem = document.querySelector(`[data-page="${pageId}"]`);
    if (navItem) navItem.classList.add('active');
    document.getElementById(`page-${pageId}`).classList.add('active');
    if (pageId === 'stats') {
        setTimeout(updateStats, 50);
    }
}

navItems.forEach(item => {
    item.addEventListener('click', () => goToPage(item.dataset.page));
});

// ===== THEME =====
const themeToggle = document.getElementById('themeToggle');
let isDark = localStorage.getItem('focusTheme') !== 'light';
function applyTheme() {
    document.body.classList.toggle('light-theme', !isDark);
    themeToggle.querySelector('i').className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    themeToggle.querySelector('span').textContent = isDark ? 'Dark' : 'Light';
}
applyTheme();
themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    localStorage.setItem('focusTheme', isDark ? 'dark' : 'light');
    applyTheme();
});

// ===== AUTH BUTTON (sidebar) =====
const authBtn = document.getElementById('authBtn');
authBtn.addEventListener('click', () => {
    if (isLoggedIn()) {
        logoutUser();
        userStudyData = {};
        updateAuthUI();
        updateStats();
        updateTodayCaptions();
        showToast('Signed out 👋');
        goToPage('focus');
    } else {
        navItems.forEach(n => n.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById('page-auth').classList.add('active');
    }
});

// ===== AUTH TABS =====
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('loginForm').classList.toggle('hidden', tab.dataset.tab !== 'login');
        document.getElementById('signupForm').classList.toggle('hidden', tab.dataset.tab !== 'signup');
        hideAuthError();
    });
});

document.getElementById('goToSignup')?.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('[data-tab="signup"]').click();
});
document.getElementById('goToLogin')?.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('[data-tab="login"]').click();
});

// ===== SIGN UP =====
document.getElementById('signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    hideAuthError();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;

    if (!name) { showAuthError('Please enter your name.'); return; }
    if (!email) { showAuthError('Please enter your email.'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { showAuthError('Passwords do not match.'); return; }

    const res = await apiCall('signup.php', 'POST', { name, email, password });

    if (res.success) {
        setCurrentUser(res.data);
        await loadUserStudyData();
        updateAuthUI();
        updateStats();
        updateTodayCaptions();
        await loadTodos();

        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('signupConfirm').value = '';

        showToast(`Welcome, ${res.data.name}! 🎉`);
        setTimeout(() => goToPage('focus'), 500);
    } else {
        showAuthError(res.message);
    }
});

// ===== SIGN IN =====
document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    hideAuthError();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    if (!email) { showAuthError('Please enter your email.'); return; }
    if (!password) { showAuthError('Please enter your password.'); return; }

    const res = await apiCall('login.php', 'POST', { email, password });

    if (res.success) {
        setCurrentUser(res.data);
        await loadUserStudyData();
        updateAuthUI();
        updateStats();
        updateTodayCaptions();
        await loadTodos();

        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';

        showToast(`Welcome back, ${res.data.name}! 👋`);
        setTimeout(() => goToPage('focus'), 500);
    } else {
        showAuthError(res.message);
    }
});

// ===== Stats page sign-in button =====
document.getElementById('statsGoToAuth')?.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-auth').classList.add('active');
});

// ===== NUMBER INPUTS =====
document.querySelectorAll('.num-input .minus').forEach(btn => {
    btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        if (parseInt(inp.value) > parseInt(inp.min || 0)) inp.value = parseInt(inp.value) - 1;
    });
});
document.querySelectorAll('.num-input .plus').forEach(btn => {
    btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        if (parseInt(inp.value) < parseInt(inp.max || 999)) inp.value = parseInt(inp.value) + 1;
    });
});

// ===== TOAST =====
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== SOUND =====
function playNotif() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523, 659, 784].forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = f; o.type = 'sine';
            g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
            o.start(ctx.currentTime + i * 0.15);
            o.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
    } catch (e) {}
}

// ===== PROGRESS RING =====
const CIRC = 2 * Math.PI * 90;
function setProgress(el, pct) {
    el.style.strokeDasharray = CIRC;
    el.style.strokeDashoffset = CIRC * (1 - pct);
}

function fmtTime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ===== STICKER CONTROL =====
const stickerImg = document.getElementById('stickerImg');
const stickerCaption = document.getElementById('stickerCaption');

function setStickerState(state) {
    stickerImg.classList.remove('sticker-idle', 'sticker-running', 'sticker-break');
    if (state === 'running') {
        stickerImg.src = 'images/studying.jpg';
        stickerImg.classList.add('sticker-running');
        stickerCaption.textContent = 'you rn →';
    } else if (state === 'break') {
        stickerImg.src = 'images/working.jpg';
        stickerImg.classList.add('sticker-break');
        stickerCaption.textContent = 'you rn →';
    } else {
        stickerImg.src = 'images/go-study.jpg';
        stickerImg.classList.add('sticker-idle');
        stickerCaption.textContent = 'go study! →';
    }
}

// ========================================================
// ============= TIMER STATE SAVE/LOAD ===================
// ========================================================
let saveTimerTimeout = null;

function getTimerState() {
    return {
        focus: {
            focusDur: F.focusDur,
            breakDur: F.breakDur,
            longBreakDur: F.longBreakDur,
            totalSess: F.totalSess,
            curSess: F.curSess,
            isBreak: F.isBreak,
            remain: F.remain,
            total: F.total,
            done: F.done,
            focusSec: F.focusSec,
            running: F.running,
            lastSaveTime: Date.now()
        },
        countdown: {
            total: CD.total,
            remain: CD.remain,
            running: CD.running,
            lastSaveTime: Date.now()
        }
    };
}

async function saveTimerState() {
    if (!isLoggedIn()) return;
    const user = getCurrentUser();
    await apiCall('save_timer.php', 'POST', {
        user_id: user.id,
        timer_data: getTimerState()
    });
}

function debounceSaveTimer() {
    if (saveTimerTimeout) clearTimeout(saveTimerTimeout);
    saveTimerTimeout = setTimeout(() => {
        saveTimerState();
    }, 2000);
}

async function loadTimerState() {
    if (!isLoggedIn()) return;
    const user = getCurrentUser();
    const res = await apiCall(`get_timer.php?user_id=${user.id}`);

    if (!res.success || !res.data) return;

    const state = res.data;

    // Restore Focus timer
    if (state.focus) {
        const sf = state.focus;
        F.focusDur = sf.focusDur || 25 * 60;
        F.breakDur = sf.breakDur || 5 * 60;
        F.longBreakDur = sf.longBreakDur || 15 * 60;
        F.totalSess = sf.totalSess || 4;
        F.curSess = sf.curSess || 1;
        F.isBreak = sf.isBreak || false;
        F.done = sf.done || 0;
        F.focusSec = sf.focusSec || 0;
        F.total = sf.total || F.focusDur;

        if (sf.running && sf.lastSaveTime) {
            const elapsed = Math.floor((Date.now() - sf.lastSaveTime) / 1000);
            F.remain = Math.max(0, (sf.remain || F.focusDur) - elapsed);
        } else {
            F.remain = sf.remain || F.focusDur;
        }

        document.getElementById('focusDuration').value = Math.round(F.focusDur / 60);
        document.getElementById('breakDuration').value = Math.round(F.breakDur / 60);
        document.getElementById('longBreakDuration').value = Math.round(F.longBreakDur / 60);
        document.getElementById('sessionCount').value = F.totalSess;
        fEl.tot.textContent = F.totalSess;

        fEl.comp.textContent = F.done;
        fEl.ft.textContent = fmtTotal(F.focusSec);

        if (F.isBreak) {
            fEl.phase.textContent = F.curSess === F.totalSess ? 'Long Break' : 'Break';
            fEl.lbl.textContent = 'BREAK';
            fEl.badge.classList.add('break-mode');
            fEl.cw.classList.add('break-mode');
        } else {
            fEl.phase.textContent = 'Focus';
            fEl.lbl.textContent = 'FOCUS';
            fEl.badge.classList.remove('break-mode');
            fEl.cw.classList.remove('break-mode');
        }

        if (sf.running && F.remain > 0) {
            F.running = false;
            updDots();
            updFocus();
            startFocus();
        } else if (sf.running && F.remain <= 0) {
            F.running = false;
            updDots();
            updFocus();
            switchPhase();
        } else {
            updDots();
            updFocus();
        }
    }

    // Restore Countdown timer
    if (state.countdown) {
        const sc = state.countdown;
        CD.total = sc.total || 25 * 60;

        if (sc.running && sc.lastSaveTime) {
            const elapsed = Math.floor((Date.now() - sc.lastSaveTime) / 1000);
            CD.remain = Math.max(0, (sc.remain || CD.total) - elapsed);
        } else {
            CD.remain = sc.remain || CD.total;
        }

        const totalSec = CD.total;
        document.getElementById('cdHours').value = Math.floor(totalSec / 3600);
        document.getElementById('cdMinutes').value = Math.floor((totalSec % 3600) / 60);
        document.getElementById('cdSeconds').value = totalSec % 60;

        document.querySelectorAll('.preset').forEach(b => {
            b.classList.remove('active');
            if (parseInt(b.dataset.minutes) * 60 === CD.total) {
                b.classList.add('active');
            }
        });

        if (sc.running && CD.remain > 0) {
            CD.running = false;
            updCD();
            cdEl.start.click();
        } else if (sc.running && CD.remain <= 0) {
            CD.running = false;
            updCD();
            playNotif();
            showToast("Time's up! ⏰");
        } else {
            updCD();
        }
    }
}

// ========================================================
// =================== FOCUS SESSIONS =====================
// ========================================================
const F = {
    focusDur: 25 * 60, breakDur: 5 * 60, longBreakDur: 15 * 60,
    totalSess: 4, curSess: 1, isBreak: false,
    remain: 25 * 60, total: 25 * 60,
    running: false, interval: null,
    done: 0, focusSec: 0
};

const fEl = {
    disp: document.getElementById('focusTimeDisplay'),
    lbl: document.getElementById('focusTimeLabel'),
    bar: document.getElementById('focusProgressBar'),
    start: document.getElementById('focusStartBtn'),
    reset: document.getElementById('focusResetBtn'),
    phase: document.getElementById('focusPhaseLabel'),
    badge: document.getElementById('focusSessionBadge'),
    cur: document.getElementById('currentSession'),
    tot: document.getElementById('totalSessions'),
    dots: document.getElementById('sessionDots'),
    comp: document.getElementById('completedSessions'),
    ft: document.getElementById('totalFocusTime'),
    cw: document.querySelector('#page-focus .timer-circle-area')
};

function updFocus() {
    fEl.disp.textContent = fmtTime(F.remain);
    setProgress(fEl.bar, F.total > 0 ? F.remain / F.total : 0);
    fEl.cur.textContent = F.curSess;
    document.title = `${fmtTime(F.remain)} ${F.isBreak ? '☕' : '🎯'} focus`;
}

function updDots() {
    fEl.dots.innerHTML = '';
    for (let i = 1; i <= F.totalSess; i++) {
        const d = document.createElement('div');
        d.className = 'dot';
        if (i < F.curSess) d.classList.add('completed');
        if (i === F.curSess) d.classList.add('active');
        fEl.dots.appendChild(d);
    }
}

function fmtTotal(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function switchPhase() {
    playNotif();
    if (F.isBreak) {
        F.isBreak = false;
        F.curSess++;
        if (F.curSess > F.totalSess) {
            showToast('All sessions done! 🎉');
            resetFocus();
            return;
        }
        F.remain = F.focusDur; F.total = F.focusDur;
        fEl.phase.textContent = 'Focus';
        fEl.lbl.textContent = 'FOCUS';
        fEl.badge.classList.remove('break-mode');
        fEl.cw.classList.remove('break-mode');
        setStickerState('running');
        showToast('Back to focus! 💪');
    } else {
        F.done++;
        F.focusSec += F.focusDur;
        fEl.comp.textContent = F.done;
        fEl.ft.textContent = fmtTotal(F.focusSec);
        recordSession(Math.round(F.focusDur / 60));

        F.isBreak = true;
        const isLong = F.curSess === F.totalSess;
        const bt = isLong ? F.longBreakDur : F.breakDur;
        F.remain = bt; F.total = bt;
        fEl.phase.textContent = isLong ? 'Long Break' : 'Break';
        fEl.lbl.textContent = 'BREAK';
        fEl.badge.classList.add('break-mode');
        fEl.cw.classList.add('break-mode');
        setStickerState('break');
        showToast(isLong ? 'Long break time! ☕' : 'Short break~ 🧘');
    }
    updDots(); updFocus();
    debounceSaveTimer();
}

function startFocus() {
    if (F.running) {
        clearInterval(F.interval);
        F.running = false;
        fEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        setStickerState('idle');
        debounceSaveTimer();
        return;
    }
    F.running = true;
    fEl.start.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
    if (!F.isBreak) setStickerState('running');
    else setStickerState('break');

    F.interval = setInterval(() => {
        F.remain--;
        updFocus();
        if (F.remain <= 0) {
            clearInterval(F.interval);
            F.running = false;
            fEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
            switchPhase();
        }
    }, 1000);

    debounceSaveTimer();
}

function resetFocus() {
    clearInterval(F.interval);
    F.running = false;
    F.curSess = 1; F.isBreak = false;
    F.remain = F.focusDur; F.total = F.focusDur;
    fEl.phase.textContent = 'Focus';
    fEl.lbl.textContent = 'FOCUS';
    fEl.badge.classList.remove('break-mode');
    fEl.cw.classList.remove('break-mode');
    fEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
    setStickerState('idle');
    updDots(); updFocus();
    debounceSaveTimer();
}

fEl.start.addEventListener('click', startFocus);
fEl.reset.addEventListener('click', () => { resetFocus(); showToast('Reset 🔄'); });

document.getElementById('focusSettingsToggle').addEventListener('click', () => {
    document.getElementById('focusSettingsContent').classList.toggle('open');
});

document.getElementById('applyFocusSettings').addEventListener('click', () => {
    F.focusDur = (parseInt(document.getElementById('focusDuration').value) || 25) * 60;
    F.breakDur = (parseInt(document.getElementById('breakDuration').value) || 5) * 60;
    F.longBreakDur = (parseInt(document.getElementById('longBreakDuration').value) || 15) * 60;
    F.totalSess = parseInt(document.getElementById('sessionCount').value) || 4;
    fEl.tot.textContent = F.totalSess;
    resetFocus();
    document.getElementById('focusSettingsContent').classList.remove('open');
    showToast('Applied ✓');
});

updDots(); updFocus(); setProgress(fEl.bar, 1);
setStickerState('idle');

// ========================================================
// ==================== COUNTDOWN =========================
// ========================================================
const CD = { total: 25 * 60, remain: 25 * 60, running: false, interval: null };
const cdEl = {
    disp: document.getElementById('countdownTimeDisplay'),
    bar: document.getElementById('countdownProgressBar'),
    start: document.getElementById('countdownStartBtn'),
    reset: document.getElementById('countdownResetBtn')
};

function updCD() {
    cdEl.disp.textContent = fmtTime(CD.remain);
    setProgress(cdEl.bar, CD.total > 0 ? CD.remain / CD.total : 0);
}

cdEl.start.addEventListener('click', () => {
    if (CD.running) {
        clearInterval(CD.interval); CD.running = false;
        cdEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        debounceSaveTimer();
        return;
    }
    if (CD.remain <= 0) return;
    CD.running = true;
    cdEl.start.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
    CD.interval = setInterval(() => {
        CD.remain--;
        updCD();
        if (CD.remain <= 0) {
            clearInterval(CD.interval); CD.running = false;
            cdEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
            playNotif();
            showToast('Time\'s up! ⏰');
            debounceSaveTimer();
        }
    }, 1000);
    debounceSaveTimer();
});

cdEl.reset.addEventListener('click', () => {
    clearInterval(CD.interval); CD.running = false;
    CD.remain = CD.total;
    cdEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
    updCD();
    debounceSaveTimer();
});

document.getElementById('setCountdownBtn').addEventListener('click', () => {
    const t = (parseInt(document.getElementById('cdHours').value) || 0) * 3600
            + (parseInt(document.getElementById('cdMinutes').value) || 0) * 60
            + (parseInt(document.getElementById('cdSeconds').value) || 0);
    if (t <= 0) { showToast('Set time > 0'); return; }
    clearInterval(CD.interval); CD.running = false;
    CD.total = t; CD.remain = t;
    cdEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
    updCD();
    document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
    showToast('Set ✓');
    debounceSaveTimer();
});

document.querySelectorAll('.preset').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const m = parseInt(btn.dataset.minutes);
        clearInterval(CD.interval); CD.running = false;
        CD.total = m * 60; CD.remain = m * 60;
        cdEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        document.getElementById('cdHours').value = 0;
        document.getElementById('cdMinutes').value = m;
        document.getElementById('cdSeconds').value = 0;
        updCD();
        debounceSaveTimer();
    });
});

setProgress(cdEl.bar, 1); updCD();


// ========================================================
// ==================== STOPWATCH =========================
// ========================================================
const SW = { running: false, start: 0, elapsed: 0, interval: null, laps: [], lastLap: 0 };
const swEl = {
    disp: document.getElementById('stopwatchDisplay'),
    ms: document.getElementById('stopwatchMs'),
    start: document.getElementById('stopwatchStartBtn'),
    reset: document.getElementById('stopwatchResetBtn'),
    lap: document.getElementById('stopwatchLapBtn'),
    list: document.getElementById('lapsList')
};

function fmtSW(ms) {
    const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function fmtMs(ms) { return `.${String(Math.floor((ms % 1000) / 10)).padStart(2, '0')}`; }

swEl.start.addEventListener('click', () => {
    if (SW.running) {
        clearInterval(SW.interval); SW.running = false;
        swEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        return;
    }
    SW.running = true;
    SW.start = Date.now() - SW.elapsed;
    swEl.start.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
    SW.interval = setInterval(() => {
        SW.elapsed = Date.now() - SW.start;
        swEl.disp.textContent = fmtSW(SW.elapsed);
        swEl.ms.textContent = fmtMs(SW.elapsed);
    }, 10);
});

swEl.reset.addEventListener('click', () => {
    clearInterval(SW.interval); SW.running = false;
    SW.elapsed = 0; SW.laps = []; SW.lastLap = 0;
    swEl.start.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
    swEl.disp.textContent = '00:00:00'; swEl.ms.textContent = '.00';
    swEl.list.innerHTML = '<div class="empty-msg"><i class="fas fa-flag"></i> No laps yet</div>';
});

swEl.lap.addEventListener('click', () => {
    if (!SW.running) return;
    const t = SW.elapsed, diff = t - SW.lastLap;
    SW.lastLap = t;
    SW.laps.push({ time: t, diff });
    renderLaps();
});

function renderLaps() {
    if (!SW.laps.length) {
        swEl.list.innerHTML = '<div class="empty-msg"><i class="fas fa-flag"></i> No laps yet</div>';
        return;
    }
    swEl.list.innerHTML = '';
    [...SW.laps].reverse().forEach((l, i) => {
        const n = SW.laps.length - i;
        const d = document.createElement('div');
        d.className = 'lap-item';
        d.innerHTML = `<span class="lap-num">#${n}</span><span class="lap-diff">+${fmtSW(l.diff)}${fmtMs(l.diff)}</span><span class="lap-time">${fmtSW(l.time)}</span>`;
        swEl.list.appendChild(d);
    });
}

// ========================================================
// ====================== TODO ============================
// ========================================================
let todos = [];
let todoFilter = 'all';

const todoPanel = document.getElementById('todoPanel');
document.getElementById('todoToggleBtn').addEventListener('click', () => todoPanel.classList.toggle('open'));
document.getElementById('todoPanelClose').addEventListener('click', () => todoPanel.classList.remove('open'));

function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

function updBadge() {
    const a = todos.filter(t => !t.completed).length;
    const b = document.getElementById('todoBadge');
    b.textContent = a; b.classList.toggle('hidden', a === 0);
}

function renderTodos() {
    const list = document.getElementById('todoList');
    let f = todos;
    if (todoFilter === 'active') f = todos.filter(t => !t.completed);
    if (todoFilter === 'completed') f = todos.filter(t => t.completed);

    if (!f.length) {
        list.innerHTML = `<li class="empty-msg">${todoFilter === 'all' ? 'No tasks yet~' : 'None'}</li>`;
    } else {
        list.innerHTML = '';
        f.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="todo-cb ${todo.completed ? 'checked' : ''}" data-id="${todo.id}">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <span class="todo-txt">${esc(todo.text)}</span>
                <button class="todo-del" data-id="${todo.id}"><i class="fas fa-xmark"></i></button>
            `;
            list.appendChild(li);
        });
    }
    document.getElementById('todoCount').textContent = `${todos.filter(t => !t.completed).length} left`;
    updBadge();
}

async function loadTodos() {
    if (!isLoggedIn()) {
        todos = [];
        renderTodos();
        return;
    }
    const user = getCurrentUser();
    const res = await apiCall(`get_todos.php?user_id=${user.id}`);
    if (res.success) {
        todos = res.data;
    } else {
        todos = [];
    }
    renderTodos();
}

async function addTodo() {
    const inp = document.getElementById('todoInput');
    const t = inp.value.trim();
    if (!t) return;

    if (!isLoggedIn()) {
        showToast('Sign in to save tasks');
        return;
    }

    const user = getCurrentUser();
    const res = await apiCall('add_todo.php', 'POST', { user_id: user.id, text: t });

    if (res.success) {
        todos.unshift(res.data);
        inp.value = '';
        renderTodos();
    } else {
        showToast(res.message);
    }
}

document.getElementById('addTodoBtn').addEventListener('click', addTodo);
document.getElementById('todoInput').addEventListener('keypress', e => { if (e.key === 'Enter') addTodo(); });

document.getElementById('todoList').addEventListener('click', async e => {
    const cb = e.target.closest('.todo-cb');
    const del = e.target.closest('.todo-del');

    if (cb) {
        const todo = todos.find(x => x.id == cb.dataset.id);
        if (todo) {
            const newState = !todo.completed;
            const res = await apiCall('update_todo.php', 'POST', {
                todo_id: todo.id,
                completed: newState ? 1 : 0
            });
            if (res.success) {
                todo.completed = newState;
                renderTodos();
            }
        }
    }

    if (del) {
        const todoId = del.dataset.id;
        const res = await apiCall('delete_todo.php', 'POST', { todo_id: parseInt(todoId) });
        if (res.success) {
            todos = todos.filter(x => x.id != todoId);
            renderTodos();
        }
    }
});

document.getElementById('clearCompletedBtn').addEventListener('click', async () => {
    if (!isLoggedIn()) return;
    const user = getCurrentUser();
    const res = await apiCall('clear_completed.php', 'POST', { user_id: user.id });
    if (res.success) {
        todos = todos.filter(t => !t.completed);
        renderTodos();
        if (res.data.deleted > 0) showToast(`Cleared ${res.data.deleted}`);
    }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        todoFilter = btn.dataset.filter;
        renderTodos();
    });
});

// ========================================================
// ====================== STATS ===========================
// ========================================================
function updateStats() {
    updateAuthUI();
    updateTodayCaptions();

    if (!isLoggedIn()) return;

    const data = getUserData();
    const today = todayKey();
    const td = data[today] || { sessions: 0, minutes: 0 };

    document.getElementById('statTodaySessions').textContent = td.sessions;
    document.getElementById('statTodayTime').textContent = td.minutes >= 60
        ? `${Math.floor(td.minutes / 60)}h${td.minutes % 60}m` : `${td.minutes}m`;

    let wk = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = d.toISOString().split('T')[0];
        if (data[k]) wk += data[k].minutes;
    }
    document.getElementById('statWeekTime').textContent = wk >= 60 ? `${Math.floor(wk / 60)}h` : `${wk}m`;

    let streak = 0;
    const cd = new Date();
    while (true) {
        const k = cd.toISOString().split('T')[0];
        if (data[k] && data[k].sessions > 0) { streak++; cd.setDate(cd.getDate() - 1); }
        else break;
    }
    document.getElementById('statStreak').textContent = streak;

    drawHeatmap();
}

function drawHeatmap() {
    const el = document.getElementById('heatmap');
    el.innerHTML = '';
    if (!isLoggedIn()) return;

    const data = getUserData();
    let maxM = 0;
    for (let i = 0; i < 60; i++) {
        const d = new Date(); d.setDate(d.getDate() - (59 - i));
        const k = d.toISOString().split('T')[0];
        if (data[k]) maxM = Math.max(maxM, data[k].minutes);
    }
    if (!maxM) maxM = 1;

    for (let i = 0; i < 60; i++) {
        const d = new Date(); d.setDate(d.getDate() - (59 - i));
        const k = d.toISOString().split('T')[0];
        const mins = (data[k] && data[k].minutes) || 0;

        let lv = 0;
        if (mins > 0) lv = 1;
        if (mins > maxM * 0.25) lv = 2;
        if (mins > maxM * 0.5) lv = 3;
        if (mins > maxM * 0.75) lv = 4;

        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.style.background = `var(--heat-${lv})`;

        const tip = document.createElement('div');
        tip.className = 'heat-tip';
        tip.textContent = `${d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}: ${mins}m`;
        cell.appendChild(tip);
        el.appendChild(cell);
    }
}

// ========================================================
// ============= TODAY STUDY CAPTIONS =====================
// ========================================================
function updateTodayCaptions() {
    let text = '0m studied today';

    if (isLoggedIn()) {
        const data = getUserData();
        const td = data[todayKey()];

        if (td && td.minutes > 0) {
            const h = Math.floor(td.minutes / 60);
            const m = td.minutes % 60;
            if (h > 0 && m > 0) text = `${h}h ${m}m studied today`;
            else if (h > 0) text = `${h}h studied today`;
            else text = `${m}m studied today`;
        }
    } else {
        text = 'Sign in to track hours';
    }

    const focusEl = document.getElementById('todayTimeFocus');
    const countdownEl = document.getElementById('todayTimeCountdown');
    const stopwatchEl = document.getElementById('todayTimeStopwatch');

    if (focusEl) focusEl.textContent = text;
    if (countdownEl) countdownEl.textContent = text;
    if (stopwatchEl) stopwatchEl.textContent = text;
}

// ========================================================
// ================ INITIAL LOAD ==========================
// ========================================================
async function initApp() {
    updateAuthUI();
    if (isLoggedIn()) {
        await loadUserStudyData();
        await loadTodos();
        await loadTimerState();
    }
    updateStats();
    updateTodayCaptions();
    renderTodos();
}

initApp();

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const active = document.querySelector('.page.active');
    if (e.code === 'Space') {
        e.preventDefault();
        if (active.id === 'page-focus') fEl.start.click();
        else if (active.id === 'page-countdown') cdEl.start.click();
        else if (active.id === 'page-timer') swEl.start.click();
    }
    if (e.code === 'KeyR') {
        if (active.id === 'page-focus') fEl.reset.click();
        else if (active.id === 'page-countdown') cdEl.reset.click();
        else if (active.id === 'page-timer') swEl.reset.click();
    }
    if (e.code === 'KeyT') todoPanel.classList.toggle('open');
});

// ===== Close todo panel when clicking outside =====
document.getElementById('mainContent').addEventListener('click', () => {
    if (todoPanel.classList.contains('open')) todoPanel.classList.remove('open');
});


// ========================================================
// ================= SPLASH SCREEN ========================
// ========================================================
window.addEventListener('load', () => {
    const splash = document.getElementById('splashScreen');
    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.remove();
        }, 600);
    }, 2000);
});

// ========================================================
// ============= SAVE ON PAGE CLOSE ======================
// ========================================================
window.addEventListener('beforeunload', () => {
    if (isLoggedIn()) {
        const user = getCurrentUser();
        const state = getTimerState();
        const data = JSON.stringify({
            user_id: user.id,
            timer_data: state
        });
        navigator.sendBeacon(API + 'save_timer.php', data);
    }
});

// Also save every 30 seconds while running
setInterval(() => {
    if (F.running || CD.running) {
        saveTimerState();
    }
}, 30000);

// ========================================================
// =================== STUDY ROOMS ========================
// ========================================================

let currentRooms = [];

// ===== AUTH GATE =====
function updateRoomsUI() {
    const prompt = document.getElementById('roomsSigninPrompt');
    const content = document.getElementById('roomsContent');
    if (!prompt || !content) return;
    if (isLoggedIn()) {
        prompt.classList.add('hidden');
        content.classList.remove('hidden');
    } else {
        prompt.classList.remove('hidden');
        content.classList.add('hidden');
    }
}

document.getElementById('roomsGoToAuth')?.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-auth').classList.add('active');
});

// ===== LOAD ROOMS =====
async function loadRooms() {
    if (!isLoggedIn()) return;
    const user = getCurrentUser();
    const grid = document.getElementById('roomsGrid');

    grid.innerHTML = '<div class="rooms-loading"><i class="fas fa-circle-notch spin"></i> Loading rooms...</div>';

    const res = await apiCall(`get_rooms.php?user_id=${user.id}`);
    if (!res.success) {
        grid.innerHTML = '<div class="rooms-empty"><i class="fas fa-triangle-exclamation"></i><p>Failed to load rooms.</p></div>';
        return;
    }

    currentRooms = res.data || [];
    renderRoomCards(currentRooms);
}

function renderRoomCards(rooms) {
    const grid = document.getElementById('roomsGrid');
    if (!rooms.length) {
        grid.innerHTML = '<div class="rooms-empty"><i class="fas fa-door-open"></i><p>No rooms yet. Create one or join with an invite code!</p></div>';
        return;
    }

    grid.innerHTML = '';
    rooms.forEach(room => {
        const goalMins = parseFloat(room.goal_hours) * 60;
        const myMins = parseInt(room.my_minutes) || 0;
        const pct = goalMins > 0 ? Math.min(100, Math.round((myMins / goalMins) * 100)) : 0;
        const myHours = (myMins / 60).toFixed(1);
        const goalHours = parseFloat(room.goal_hours).toFixed(0);

        const card = document.createElement('div');
        card.className = 'room-card';
        card.dataset.roomId = room.id;
        card.innerHTML = `
            <div class="room-card-header">
                <div class="room-card-name">${esc(room.name)}</div>
                ${room.description ? `<div class="room-card-desc">${esc(room.description)}</div>` : ''}
            </div>
            <div class="room-card-progress">
                <div class="room-mini-bar-bg">
                    <div class="room-mini-bar-fill" style="width:${pct}%"></div>
                </div>
                <div class="room-card-progress-labels">
                    <span>Your: ${myHours}h / ${goalHours}h goal</span>
                    <span>${pct}%</span>
                </div>
            </div>
            <div class="room-card-meta">
                <span><i class="fas fa-users"></i> ${room.member_count} members</span>
                <span><i class="fas fa-bullseye"></i> ${goalHours}h goal</span>
            </div>
            <div class="room-card-footer">
                <span class="room-owner-tag"><i class="fas fa-user"></i> ${esc(room.owner_name)}</span>
                ${parseFloat(room.price) > 0
                    ? `<span class="room-price-tag">${room.price} DZD</span>`
                    : `<span class="room-free-tag">Free</span>`}
            </div>
        `;
        card.addEventListener('click', () => openRoomDetail(room.id));
        grid.appendChild(card);
    });
}

// ===== ROOM DETAIL =====
// Track currently viewed room
let _currentDetailRoomId = null;
let _currentDetailInviteCode = null;
let _currentDetailRoomName = null;

async function openRoomDetail(roomId) {
    const user = getCurrentUser();
    if (!user) return;

    const modal = document.getElementById('roomDetailModal');
    const lbList = document.getElementById('leaderboardList');
    lbList.innerHTML = '<div class="empty-msg"><i class="fas fa-circle-notch spin"></i> Loading...</div>';
    modal.classList.remove('hidden');

    const res = await apiCall(`get_room_details.php?room_id=${roomId}&user_id=${user.id}`);
    if (!res.success) {
        lbList.innerHTML = '<div class="empty-msg">Failed to load room details.</div>';
        return;
    }

    const { room, members, total_minutes, goal_minutes } = res.data;

    // Store for Enter Room button
    _currentDetailRoomId = roomId;
    _currentDetailInviteCode = room.invite_code;
    _currentDetailRoomName = room.name;

    // Show correct button based on ownership — safely, in case buttons not yet in HTML
    const deleteBtn = document.getElementById('deleteRoomBtn');
    const leaveBtn = document.getElementById('leaveRoomMemberBtn');
    const isOwner = parseInt(room.owner_id) === parseInt(user.id);
    if (deleteBtn) deleteBtn.style.display = isOwner ? 'flex' : 'none';
    if (leaveBtn) leaveBtn.style.display = !isOwner ? 'flex' : 'none';

    document.getElementById('detailRoomName').textContent = room.name;
    document.getElementById('detailRoomDesc').textContent = room.description || '';
    document.getElementById('detailInviteCode').textContent = room.invite_code;

    // Progress
    const pct = goal_minutes > 0 ? Math.min(100, Math.round((total_minutes / goal_minutes) * 100)) : 0;
    document.getElementById('detailProgressFill').style.width = pct + '%';
    document.getElementById('detailProgressText').textContent =
        `${(total_minutes/60).toFixed(1)}h / ${(goal_minutes/60).toFixed(0)}h total`;
    document.getElementById('detailProgressPct').textContent = pct + '%';

    // Leaderboard
    const maxMins = members.length ? Math.max(...members.map(m => parseInt(m.total_minutes) || 0)) : 1;
    lbList.innerHTML = '';
    if (!members.length) {
        lbList.innerHTML = '<div class="empty-msg">No members yet.</div>';
    } else {
        members.forEach((m, i) => {
            const mins = parseInt(m.total_minutes) || 0;
            const hrs = (mins / 60).toFixed(1);
            const barPct = maxMins > 0 ? Math.round((mins / maxMins) * 100) : 0;
            const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
            const isMe = m.id == user.id;

            const item = document.createElement('div');
            item.className = 'lb-item';
            item.innerHTML = `
                <span class="lb-rank ${rankClass}">${rankIcon}</span>
                <span class="lb-name">${esc(m.name)}${isMe ? ' <span style="color:var(--text-3);font-size:0.65rem;">(you)</span>' : ''}</span>
                <div class="lb-bar-wrap">
                    <div class="lb-bar-bg"><div class="lb-bar-fill" style="width:${barPct}%"></div></div>
                </div>
                <span class="lb-time">${hrs}h</span>
            `;
            lbList.appendChild(item);
        });
    }
}

document.getElementById('closeDetailModal')?.addEventListener('click', () => {
    document.getElementById('roomDetailModal').classList.add('hidden');
});

// Enter Room button
document.getElementById('enterRoomBtn')?.addEventListener('click', () => {
    if (!_currentDetailRoomId) return;
    const url = `room.html?room_id=${_currentDetailRoomId}&room_name=${encodeURIComponent(_currentDetailRoomName)}&invite_code=${_currentDetailInviteCode}`;
    window.location.href = url;
});

// Copy invite code
document.getElementById('copyInviteCodeBtn')?.addEventListener('click', () => {
    const code = document.getElementById('detailInviteCode').textContent;
    navigator.clipboard.writeText(code).then(() => showToast('Code copied! 📋'));
});

// ===== CREATE ROOM =====
document.getElementById('openCreateRoomBtn')?.addEventListener('click', () => {
    if (!isLoggedIn()) { showToast('Sign in first!'); return; }
    document.getElementById('createRoomModal').classList.remove('hidden');
    document.getElementById('createRoomError').classList.add('hidden');
    document.getElementById('roomName').value = '';
    document.getElementById('roomDesc').value = '';
    document.getElementById('roomGoalHours').value = 10;
    document.getElementById('roomMaxMembers').value = 10;
    document.getElementById('roomPrice').value = 0;
});

document.getElementById('closeCreateModal')?.addEventListener('click', () => {
    document.getElementById('createRoomModal').classList.add('hidden');
});

document.getElementById('createRoomSubmitBtn')?.addEventListener('click', async () => {
    const user = getCurrentUser();
    const name = document.getElementById('roomName').value.trim();
    const description = document.getElementById('roomDesc').value.trim();
    const goal_hours = parseFloat(document.getElementById('roomGoalHours').value) || 10;
    const max_members = parseInt(document.getElementById('roomMaxMembers').value) || 10;
    const price = parseFloat(document.getElementById('roomPrice').value) || 0;
    const errEl = document.getElementById('createRoomError');

    if (!name) {
        errEl.textContent = 'Room name is required.';
        errEl.classList.remove('hidden');
        return;
    }

    const btn = document.getElementById('createRoomSubmitBtn');
    btn.innerHTML = '<i class="fas fa-circle-notch spin"></i><span>Creating...</span>';
    btn.disabled = true;

    const res = await apiCall('create_room.php', 'POST', {
        user_id: user.id, name, description, goal_hours, max_members, price
    });

    btn.innerHTML = '<i class="fas fa-plus"></i><span>Create Room</span>';
    btn.disabled = false;

    if (res.success) {
        document.getElementById('createRoomModal').classList.add('hidden');
        document.getElementById('createdInviteCode').textContent = res.data.invite_code;
        document.getElementById('roomCreatedModal').classList.remove('hidden');
        loadRooms();
    } else {
        errEl.textContent = res.message;
        errEl.classList.remove('hidden');
    }
});

document.getElementById('closeRoomCreatedModal')?.addEventListener('click', () => {
    document.getElementById('roomCreatedModal').classList.add('hidden');
});

document.getElementById('copyCreatedCodeBtn')?.addEventListener('click', () => {
    const code = document.getElementById('createdInviteCode').textContent;
    navigator.clipboard.writeText(code).then(() => showToast('Code copied! 📋'));
});

// ===== JOIN ROOM =====
document.getElementById('openJoinRoomBtn')?.addEventListener('click', () => {
    if (!isLoggedIn()) { showToast('Sign in first!'); return; }
    document.getElementById('joinRoomModal').classList.remove('hidden');
    document.getElementById('joinRoomError').classList.add('hidden');
    document.getElementById('joinInviteCode').value = '';
});

document.getElementById('closeJoinModal')?.addEventListener('click', () => {
    document.getElementById('joinRoomModal').classList.add('hidden');
});

document.getElementById('joinRoomSubmitBtn')?.addEventListener('click', async () => {
    const user = getCurrentUser();
    const invite_code = document.getElementById('joinInviteCode').value.trim().toUpperCase();
    const errEl = document.getElementById('joinRoomError');

    if (invite_code.length !== 8) {
        errEl.textContent = 'Invite code must be 8 characters.';
        errEl.classList.remove('hidden');
        return;
    }

    const btn = document.getElementById('joinRoomSubmitBtn');
    btn.innerHTML = '<i class="fas fa-circle-notch spin"></i><span>Joining...</span>';
    btn.disabled = true;

    const res = await apiCall('join_room.php', 'POST', { user_id: user.id, invite_code });

    btn.innerHTML = '<i class="fas fa-right-to-bracket"></i><span>Join Room</span>';
    btn.disabled = false;

    if (res.success) {
        if (res.data.requires_payment) {
            document.getElementById('joinRoomModal').classList.add('hidden');
            const payRes = await apiCall('create_payment.php', 'POST', {
                user_id: user.id,
                room_id: res.data.room_id
            });
            if (payRes.success) {
                window.location.href = payRes.data.checkout_url;
            } else {
                showToast('Payment error: ' + payRes.message);
            }
        } else {
            document.getElementById('joinRoomModal').classList.add('hidden');
            showToast('Joined room! 🎉');
            loadRooms();
        }
    } else {
        errEl.textContent = res.message;
        errEl.classList.remove('hidden');
    }
});

// Auto-uppercase invite code input
document.getElementById('joinInviteCode')?.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
});

// ===== REFRESH BUTTON =====
document.getElementById('refreshRoomsBtn')?.addEventListener('click', () => {
    loadRooms();
    showToast('Refreshed ↺');
});

// ===== CLOSE MODALS ON OVERLAY CLICK =====
['createRoomModal', 'joinRoomModal', 'roomDetailModal', 'roomCreatedModal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
    });
});

// ===== WIRE UP NUM INPUTS FOR ROOM MODALS =====
document.querySelectorAll('#createRoomModal .num-input .minus').forEach(btn => {
    btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        if (inp && parseInt(inp.value) > parseInt(inp.min || 0)) inp.value = parseInt(inp.value) - 1;
    });
});
document.querySelectorAll('#createRoomModal .num-input .plus').forEach(btn => {
    btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        if (inp && parseInt(inp.value) < parseInt(inp.max || 9999)) inp.value = parseInt(inp.value) + 1;
    });
});

// ===== DELETE / LEAVE ROOM =====
document.getElementById('deleteRoomBtn')?.addEventListener('click', async () => {
    if (!confirm('Delete this room? This cannot be undone.')) return;
    const user = getCurrentUser();
    const res = await apiCall('delete_room.php', 'POST', { room_id: _currentDetailRoomId, user_id: user.id });
    if (res.success) {
        document.getElementById('roomDetailModal').classList.add('hidden');
        showToast('Room deleted 🗑️');
        loadRooms();
    } else {
        showToast('Error: ' + res.message);
    }
});

document.getElementById('leaveRoomMemberBtn')?.addEventListener('click', async () => {
    if (!confirm('Leave this room?')) return;
    const user = getCurrentUser();
    const res = await apiCall('leave_room.php', 'POST', { room_id: _currentDetailRoomId, user_id: user.id });
    if (res.success) {
        document.getElementById('roomDetailModal').classList.add('hidden');
        showToast('Left room 👋');
        loadRooms();
    } else {
        showToast('Error: ' + res.message);
    }
});

// ===== HOOK INTO NAV: load rooms when tab clicked =====
document.querySelector('[data-page="rooms"]')?.addEventListener('click', () => {
    updateRoomsUI();
    if (isLoggedIn()) loadRooms();
});