// ==========================================
// CONFIGURACIÓ
// ==========================================

// ⚠️ IMPORTANT: Substitueix 'YOUR_API_KEY' per la teva clau real de Google Gemini
const GEMINI_API_KEY = 'AIzaSyDAQRs-5owy76fTRMkvQVod4vn-ujCb7vg';

// ==========================================
// DADES DELS AVATARS (50 EXPERTS)
// ==========================================

const AVATARS = [
    {
        id: 1,
        category: 'saber',
        name: 'Albert Einstein',
        role: 'Físic Teòric',
        emoji: '⚛️',
        image: 'images/einstein_hero.png',
        color: '#a29bfe',
        greeting: 'La imaginació és més important que el coneixement. Què vols descobrir avui?',
        systemPrompt: `Ets Albert Einstein. Parles de física, univers i curiositat amb un toc d'humor i saviesa. IMPORTANT: Les teves respostes han de ser EXTENSES, DETALLADES i PROFUNDES. No tinguis por d'escriure paràgrafs llargs per explicar conceptes complexos. Utilitza format Markdown. RESTRICCIÓ: Només respons preguntes sobre FÍSICA, MATEMÀTIQUES, CIÈNCIA, UNIVERS o la teva VIDA/FILOSOFIA. Si l'usuari et pregunta sobre altres temes (cuina, esports, política actual...), declina educadament i reconduu la conversa cap a la ciència.`
    },
    {
        id: 2,
        category: 'ment',
        name: 'Sigmund Freud',
        role: 'Pare de la Psicoanàlisi',
        emoji: '🧠',
        image: 'images/freud_hero.png',
        color: '#e17055',
        greeting: 'Els somnis són el camí reial cap a l\'inconscient. Què et preocupa realment?',
        systemPrompt: `Ets Sigmund Freud. Parles de psicoanàlisi, somnis, l'inconscient i la naturalesa humana. Ets analític, profund i una mica provocador. IMPORTANT: Les teves respostes han de ser EXTENSES, DETALLADES i PROFUNDES. Analitza el que et diu l'usuari. Utilitza format Markdown. RESTRICCIÓ: Només respons preguntes sobre PSICOLOGIA, MENT, SOMNIS o la teva TEORIA. Si l'usuari et pregunta sobre temes aliens (física, tecnologia, esports...), declina educadament o analitza per què l'usuari té interès en això, però no donis informació tècnica fora del teu camp.`
    },
    {
        id: 3,
        category: 'saber',
        name: 'Plató',
        role: 'Filòsof Grec',
        emoji: '🏛️',
        image: 'images/plato_hero.png',
        color: '#74b9ff',
        greeting: 'La vida no examinada no val la pena ser viscuda. Quina veritat busques?',
        systemPrompt: `Ets Plató, el filòsof grec. Parles de la veritat, la justícia, les idees i l'ànima. Utilitzes el mètode socràtic (fer preguntes per arribar a la veritat). IMPORTANT: Les teves respostes han de ser EXTENSES, DETALLADES i PROFUNDES. Utilitza format Markdown. RESTRICCIÓ: Només respons preguntes sobre FILOSOFIA, ÈTICA, POLÍTICA o METAFÍSICA. Si l'usuari et pregunta sobre tecnologia moderna o ciència empírica, declina educadament dient que això pertany al món de les ombres i no a les Idees pures.`
    },
    {
        id: 4,
        category: 'saber',
        name: 'Ludwig Wittgenstein',
        role: 'Filòsof del Llenguatge',
        emoji: '📐',
        image: 'images/wittgenstein_hero.png',
        color: '#636e72',
        greeting: 'Els límits del meu llenguatge signifiquen els límits del meu món. De què vols parlar?',
        systemPrompt: `Ets Ludwig Wittgenstein. Parles de lògica, llenguatge, filosofia de la ment i els límits del que es pot dir. Ets auster, precís, intens i a vegades impacient amb la manca de rigor o la xerrameca buida. IMPORTANT: Les teves respostes han de ser EXTENSES, DETALLADES i PROFUNDES. Utilitza format Markdown. RESTRICCIÓ: Només respons preguntes sobre FILOSOFIA, LÒGICA, LLENGUATGE o la teva VIDA. Si l'usuari et pregunta sobre banalitats, respon que "d'allò que no es pot parlar, s'ha de guardar silenci" o analitza el joc de llenguatge que està utilitzant.`
    },
    {
        id: 5,
        category: 'saber',
        name: 'Charles Darwin',
        role: 'Naturalista',
        emoji: '🐢',
        image: 'images/darwin_hero.png',
        color: '#27ae60',
        greeting: 'No és la més forta de les espècies la que sobreviu, sinó la que millor s\'adapta al canvi. Què vols explorar?',
        systemPrompt: `Ets Charles Darwin. Parles d'evolució, natura, biologia i observació científica. Ets curiós, meticulós i humil. IMPORTANT: Les teves respostes han de ser EXTENSES, DETALLADES i PROFUNDES. Utilitza format Markdown. RESTRICCIÓ: Només respons preguntes sobre BIOLOGIA, NATURA, EVOLUCIÓ o la teva VIDA. Si l'usuari et pregunta sobre tecnologia o política moderna, relaciona-ho amb l'adaptació i la selecció natural o declina educadament.`
    }
];

// ==========================================
// ESTAT DE L'APLICACIÓ
// ==========================================

let currentAvatar = null;
let chatHistory = [];
let currentCategory = 'all';

// Elements del DOM
const avatarsGrid = document.getElementById('avatars-grid');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const categoryBtns = document.querySelectorAll('.category-btn');

// ==========================================
// GEMINI API INTEGRATION (AMB FALLBACK)
// ==========================================

// Llista de models per ordre de preferència (Qualitat > Velocitat)
const AVAILABLE_MODELS = [
    'gemini-1.5-pro-latest', // Més potent (Raonament profund)
    'gemini-2.0-flash'       // Més ràpid (Fallback fiable)
];

async function callGeminiAPI(userMessage, avatar) {
    if (!GEMINI_API_KEY) {
        return "⚠️ Error: Falta la Clau API. Si us plau, afegeix la teva Google Gemini API Key al fitxer app.js.";
    }

    // Construir l'historial per al context (darrers 5 missatges)
    const recentHistory = chatHistory.slice(-5).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [{ text: `System Instruction: ${avatar.systemPrompt} ` }]
            },
            ...recentHistory,
            {
                role: "user",
                parts: [{ text: userMessage }]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    };

    // Bucle d'intents amb Fallback
    for (const model of AVAILABLE_MODELS) {
        console.log(`🔄 Intentant connectar amb el model: ${model}...`);

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.error) {
                console.warn(`⚠️ Error amb ${model}:`, data.error.message);
                continue; // Si falla, passa al següent model
            }

            if (data.candidates && data.candidates[0].content) {
                console.log(`✅ Èxit amb ${model}!`);
                return data.candidates[0].content.parts[0].text;
            }

        } catch (error) {
            console.warn(`⚠️ Error de xarxa amb ${model}:`, error);
            // Continua al següent model
        }
    }

    // Si tots els models fallen
    console.error("❌ Tots els models han fallat.");
    return "Ho sento, els meus circuits estan sobrecarregats. No he pogut connectar amb cap cervell disponible. Torna-ho a provar en uns segons.";
}

// ==========================================
// INTERFÍCIE D'USUARI I NAVEGACIÓ
// ==========================================

window.showScreen = function (screenName) {
    const screens = {
        welcome: document.getElementById('pantallaBenvinguda'),
        selection: document.getElementById('selection-screen'),
        chat: document.getElementById('chat-screen')
    };

    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active', 'activa');
    });

    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    } else {
        console.error(`Screen "${screenName}" not found`);
    }
}


function renderAvatars(filter = 'all') {

    const filteredAvatars = filter === 'all'
        ? AVATARS
        : AVATARS.filter(a => a.category === filter);

    avatarsGrid.innerHTML = filteredAvatars.map(avatar => {
        const imageStyle = avatar.image ? `background-image: url('${avatar.image}');` : '';
        // Use a soft background color for emojis if no image
        const bgStyle = avatar.image ? '' : `background-color: ${avatar.color}20;`;
        const emojiContent = avatar.image ? '' : `<span class="avatar-emoji-placeholder">${avatar.emoji}</span>`;

        return `
        <div class="avatar-card" id="avatar-card-${avatar.id}" onclick="selectAvatar(${avatar.id})">
            <div class="avatar-shine"></div>
            <div class="avatar-image-area" style="${imageStyle} ${bgStyle}">
                ${emojiContent}
            </div>
            <div class="avatar-info-area" style="border-bottom: 4px solid ${avatar.color}">
                <h3 class="avatar-name">${avatar.name}</h3>
                <span class="avatar-role">${avatar.role}</span>
            </div>
        </div>
        `;
    }).join('');

    // Add Parallax Effect Listeners
    filteredAvatars.forEach(avatar => {
        const card = document.getElementById(`avatar-card-${avatar.id}`);
        const shine = card.querySelector('.avatar-shine');

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // Mouse X relative to card
            const y = e.clientY - rect.top;  // Mouse Y relative to card

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation (max 10 degrees)
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            // Apply 3D rotation
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

            // Move shine effect
            shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.3) 0%, transparent 60%)`;
        });

        card.addEventListener('mouseleave', () => {
            // Reset position
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            shine.style.opacity = '0';
        });

        card.addEventListener('mouseenter', () => {
            shine.style.opacity = '1';
        });
    });
}

function selectAvatar(id) {

    currentAvatar = AVATARS.find(a => a.id === id);

    if (!currentAvatar) {

        return;
    }



    // Configurar UI del Xat
    document.getElementById('chat-avatar-img').textContent = currentAvatar.emoji;
    document.getElementById('chat-avatar-name').textContent = currentAvatar.name;
    document.getElementById('chat-avatar-role').textContent = currentAvatar.role;

    // Reset
    chatMessages.innerHTML = '';
    chatHistory = [];

    showScreen('chat');

    // Missatge inicial
    setTimeout(() => {
        addMessage(currentAvatar.greeting, 'bot');
    }, 600);
}

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    // Convertir markdown simple a HTML (negreta i cursiva)
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

    msgDiv.innerHTML = formattedText;

    chatMessages.appendChild(msgDiv);
    scrollToBottom();

    // Guardar a l'historial
    chatHistory.push({ text: text, sender: sender });
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatMessages.appendChild(indicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    showTypingIndicator();

    // Cridar a l'API real
    const response = await callGeminiAPI(text, currentAvatar);

    removeTypingIndicator();
    addMessage(response, 'bot');
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.getElementById('btn-back').addEventListener('click', () => {
    showScreen('selection');
});

btnSend.addEventListener('click', handleSendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});

// Inicialització
document.addEventListener('DOMContentLoaded', () => {
    // Start at Welcome Screen
    console.log('🚀 App initialized');
    showScreen('welcome');
    renderAvatars();

    // Event Listener for Start Button
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
        console.log('✅ Start button found, attaching listener');
        btnStart.addEventListener('click', () => {
            console.log('🖱️ Start button clicked');
            showScreen('selection');
        });
    } else {
        console.error('❌ Start button NOT found');
    }

    // Event Listeners for Filters
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            // Add active to clicked
            e.target.classList.add('active');
            // Filter
            renderAvatars(e.target.dataset.category);
        });
    });
});
