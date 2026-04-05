const GEMINI_API_URL = '/api/gemini';

document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       1. ROUTING LOGIC (SPA)
       =============================== */
    const appBox = document.querySelector('.app-viewport');
    const appBar = document.getElementById('app-bar');
    const backBtn = document.getElementById('back-btn');
    const screenTitle = document.getElementById('screen-title');
    const screens = document.querySelectorAll('.screen');
    const navCards = document.querySelectorAll('.grid-container .card');

    function navigateTo(targetId, title, themeColor = "#10B981") {
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) targetScreen.classList.add('active');

        if (targetId === 'screen-home') {
            appBar.classList.add('hidden');
        } else {
            appBar.classList.remove('hidden');
            screenTitle.innerText = title;
            appBar.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        }
        
        if (targetId === 'screen-weather') fetchWeather();
    }

    navigateTo('screen-home', 'BHUMIIQ');

    navCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-target');
            const title = card.getAttribute('data-title');
            card.classList.add('active');
            setTimeout(() => navigateTo(target, title), 200);
        });
    });

    const goBack = () => {
        navigateTo('screen-home', 'BHUMIIQ');
        if (recognition && isListening) recognition.stop();
        window.speechSynthesis.cancel();
    };

    backBtn.addEventListener('click', goBack);
    document.querySelectorAll('.btn-back-home').forEach(btn => btn.addEventListener('click', goBack));


    /* ===============================
       2. WEATHER API (Open-Meteo)
       =============================== */
    const weatherLoading = document.getElementById('weather-loading');
    const weatherResult = document.getElementById('weather-result');
    const wTemp = document.getElementById('w-temp');
    const wDesc = document.getElementById('w-desc');
    const wLoc = document.getElementById('w-location');
    const wIcon = document.getElementById('w-icon');

    function fetchWeather() {
        weatherLoading.classList.remove('hidden');
        weatherResult.classList.add('hidden');

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                try {
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                    const data = await res.json();
                    const temp = Math.round(data.current_weather.temperature);
                    const code = data.current_weather.weathercode;
                    wTemp.innerText = `${temp}°C`;
                    
                    if (code <= 3) { wDesc.innerText = "Clear Skies"; wIcon.innerText = "sunny"; }
                    else if (code <= 48) { wDesc.innerText = "Foggy Condition"; wIcon.innerText = "foggy"; }
                    else if (code <= 69) { wDesc.innerText = "Rainy Day (बारिश)"; wIcon.innerText = "rainy"; }
                    else { wDesc.innerText = "Storm Warning"; wIcon.innerText = "thunderstorm"; }

                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const geoData = await geoRes.json();
                    let placeName = geoData.address.city || geoData.address.town || geoData.address.village || "Local Area";
                    wLoc.innerText = `Field: ${placeName}, ${geoData.address.country}`;
                    
                    weatherLoading.classList.add('hidden');
                    weatherResult.classList.remove('hidden');
                } catch (e) {
                    wDesc.innerText = "Connection lost.";
                    weatherLoading.classList.add('hidden');
                }
            }, () => {
                wDesc.innerText = "Enable GPS for local weather.";
                weatherLoading.classList.add('hidden');
            });
        }
    }

    /* ===============================
       3. PLANT HEALTH IQ (Enhanced Gemini Vision)
       =============================== */
    const cameraInput = document.getElementById('camera-input');
    const galleryInput = document.getElementById('gallery-input');
    const leafImage = document.getElementById('leaf-image');
    const btnAnalyze = document.getElementById('btn-analyze');
    const aiPhotoResult = document.getElementById('ai-photo-result');
    const aiPhotoText = aiPhotoResult.querySelector('p');

    let base64ImageString = null;
    let imageMimeType = null;

    document.getElementById('btn-camera').addEventListener('click', () => cameraInput.click());
    document.getElementById('btn-gallery').addEventListener('click', () => galleryInput.click());

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            document.getElementById('img-placeholder-icon').style.display = 'none';
            document.getElementById('img-placeholder-text').style.display = 'none';
            leafImage.style.display = 'block';
            leafImage.src = evt.target.result;
            base64ImageString = evt.target.result.split(',')[1];
            imageMimeType = file.type;
            aiPhotoResult.classList.add('hidden');
        }
        reader.readAsDataURL(file);
    }
    cameraInput.addEventListener('change', handleImageUpload);
    galleryInput.addEventListener('change', handleImageUpload);

    btnAnalyze.addEventListener('click', async () => {
        if (!base64ImageString) {
            alert('Please select a photo first!');
            return;
        }

        aiPhotoResult.classList.remove('hidden');
        aiPhotoText.innerHTML = `<div class="text-center p-24"><div class="shimmer" style="height:20px; border-radius:10px; margin-bottom:10px;"></div><p>Calculating Health IQ...</p></div>`;

        try {
            const prompt = `You are BHUMIIQ, a professional AI Agricultural Consultant. 
            Analyze this plant image deeply.
            1. Determine if it is a plant. If not, reject.
            2. Calculate a "Health Score" from 0 to 100.
            3. Provide a Status: [EXCELLENT, GOOD, CRITICAL, or DANGER].
            4. Identify any diseases or pests.
            5. Provide a "Recovery Roadmap": Step-by-step process to improve health.
            6. "Safety Check": Is the crop currently safe or at risk?
            
            Return your response in a structured format with English and Hindi translations. Use bullet points for steps.`;

            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: imageMimeType, data: base64ImageString } }
                    ]
                }],
                type: 'vision'
            };

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Intelligence Service Offline");

            const data = await response.json();
            const replyText = data.candidates[0].content.parts[0].text;
            
            // Extract a possible score (0-100) if mentioned, otherwise mock for UI
            const scoreMatch = replyText.match(/(\d+)%/);
            const score = scoreMatch ? scoreMatch[1] : 75;

            aiPhotoText.innerHTML = `
                <div class="health-gauge-container">
                    <div class="health-gauge">
                        <span class="health-value">${score}%</span>
                    </div>
                    <div class="status-badge" style="background:${score > 70 ? '#10B981' : '#F59E0B'}; color:white;">
                        ${score > 70 ? 'HEALTHY' : 'RECOVERY NEEDED'}
                    </div>
                </div>
                <div class="p-16">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <span class="btn btn-tertiary" id="btn-listen-photo"><span class="material-symbols-outlined">volume_up</span> Listen</span>
                    </div>
                    <div class="report-content">${replyText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                </div>
            `;

            document.getElementById('btn-listen-photo').addEventListener('click', () => speakText(replyText));

        } catch (error) {
            aiPhotoText.innerHTML = `<p class="p-24 text-center" style="color:#EF4444;">Error analyzed: ${error.message}</p>`;
        }
    });

    /* ===============================
       4. MANDI PRICE TRENDS
       =============================== */
    const mandiPreviewBtn = document.getElementById('mandi-search-btn');
    const mandiResults = document.getElementById('mandi-results');

    mandiPreviewBtn.addEventListener('click', async () => {
        const state = document.getElementById('mandi-state').value;
        const comm = document.getElementById('mandi-comm').value;
        if (!state || !comm) { alert("Select State & Crop"); return; }

        mandiResults.innerHTML = `<div class="p-24 shimmer" style="border-radius:20px;">Analyzing Price Intelligence...</div>`;

        try {
            const prompt = `You are BHUMIIQ Market AI. Analyze current price trends for ${comm} in ${state}. Suggest if it's a good time to sell. English and Hindi.`;
            const payload = { contents: [{ parts: [{ text: prompt }] }], type: 'text' };
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            const replyText = data.candidates[0].content.parts[0].text;

            mandiResults.innerHTML = `
                <div class="glass-card p-20 text-left border-glow">
                    <h4 style="color:var(--brand-primary); margin-bottom:8px;">Intelligence Report</h4>
                    <div style="font-size:14px; line-height:1.6;">${replyText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                </div>
            `;
        } catch (e) {
            mandiResults.innerHTML = "Market Service unavailable.";
        }
    });

    /* ===============================
       5. VOICE IQ (Gemma-3-4B)
       =============================== */
    const voiceBtn = document.getElementById('voice-btn');
    const chatContainer = document.getElementById('chat-container');
    let recognition = null;
    let isListening = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.onstart = () => { isListening = true; voiceBtn.style.boxShadow = '0 0 40px var(--brand-primary)'; };
        recognition.onresult = async (e) => {
            const text = e.results[0][0].transcript;
            appendChat('User', text);
            await askVoiceGemini(text);
        };
        recognition.onend = () => { isListening = false; voiceBtn.style.boxShadow = ''; };
    }

    voiceBtn.addEventListener('click', () => recognition && recognition.start());

    function appendChat(user, text) {
        const div = document.createElement('div');
        div.className = user === 'User' ? 'chat-bubble chat-user' : 'chat-bubble glass-card';
        div.innerHTML = `<p>${text}</p>`;
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function askVoiceGemini(query) {
        try {
            const payload = { contents: [{ parts: [{ text: `You are BHUMIIQ AI. Answer in 1 short Hindi sentence: ${query}` }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            const reply = data.candidates[0].content.parts[0].text;
            appendChat('BHUMIIQ', reply);
            speakText(reply);
        } catch (e) { appendChat('BHUMIIQ', 'क्षमा करें, त्रुटि हुई।'); }
    }

    function speakText(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN';
            window.speechSynthesis.speak(utterance);
        }
    }
});
