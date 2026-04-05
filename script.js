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
    const navLinks = document.querySelectorAll('.nav-links a');
    const navLogo = document.getElementById('nav-logo');

    function navigateTo(targetId, title) {
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) targetScreen.classList.add('active');

        // Scroll to top of the screen contents
        appBox.scrollTo({ top: 0, behavior: 'smooth' });

        if (targetId === 'screen-home') {
            appBar.classList.add('hidden');
        } else {
            appBar.classList.remove('hidden');
            screenTitle.innerText = title;
        }
        
        if (targetId === 'screen-weather') fetchWeather();
    }

    // Initialize Home
    navigateTo('screen-home', 'BHUMIIQ');

    // Grid Card Clicks
    navCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-target');
            const title = card.getAttribute('data-title');
            navigateTo(target, title);
        });
    });

    // Navbar Link Clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            const title = link.textContent;
            navigateTo(target, title);
        });
    });

    // Logo click goes home
    navLogo.addEventListener('click', () => navigateTo('screen-home', 'BHUMIIQ'));

    // Back Buttons
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
                    
                    if (code <= 3) { wDesc.innerText = "Clear / Partly Cloudy"; wIcon.innerText = "sunny"; }
                    else if (code <= 48) { wDesc.innerText = "Foggy Condition"; wIcon.innerText = "foggy"; }
                    else if (code <= 69) { wDesc.innerText = "Rainy (बारिश)"; wIcon.innerText = "rainy"; }
                    else { wDesc.innerText = "Thunderstorm / Snow"; wIcon.innerText = "thunderstorm"; }

                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const geoData = await geoRes.json();
                    let placeName = geoData.address.city || geoData.address.town || geoData.address.village || "Current Location";
                    wLoc.innerText = `Location: ${placeName}, ${geoData.address.country}`;
                    
                    weatherLoading.classList.add('hidden');
                    weatherResult.classList.remove('hidden');
                } catch (e) {
                    wDesc.innerText = "Weather unavailable.";
                    weatherLoading.classList.add('hidden');
                }
            }, () => {
                wDesc.innerText = "Enable Location for Weather.";
                weatherLoading.classList.add('hidden');
            });
        }
    }

    /* ===============================
       3. PLANT HEALTH IQ (Enhanced Vision)
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
            alert('Capture or Upload a photo first!');
            return;
        }

        aiPhotoResult.classList.remove('hidden');
        aiPhotoText.innerHTML = `<div class="text-center p-24"><div class="shimmer" style="height:20px; border-radius:10px;"></div><p>Performing Satellite Analysis...</p></div>`;

        try {
            const prompt = `You are BHUMIIQ, an AI Agricultural Scientist. 
            Analyze this image:
            - Is it a plant or agricultural crop?
            - Determine Health Score (percentage 0-100%).
            - Identify Diseases and suggest specific treatments.
            - Provide a step-by-step 'Recovery Roadmap'.
            - Safety status: [EXCELLENT, GOOD, ALERT, DANGER].
            Provide response in English and clear Hindi.`;

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

            const data = await response.json();
            const replyText = data.candidates[0].content.parts[0].text;
            
            aiPhotoText.innerHTML = `
                <div class="p-24">
                    <button class="btn btn-primary btn-pill mb-16" id="btn-listen-photo"><span class="material-symbols-outlined">volume_up</span> Listen Report</button>
                    <div class="report-content" style="line-height:1.6; font-size:14px;">
                        ${replyText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                    </div>
                </div>
            `;

            document.getElementById('btn-listen-photo').addEventListener('click', () => speakText(replyText));

        } catch (error) {
            aiPhotoText.innerHTML = `<p class="p-24 text-center" style="color:red;">Error: ${error.message}</p>`;
        }
    });

    /* ===============================
       4. SOILGOLD (Waste to Wealth)
       =============================== */
    const soilgoldBtn = document.getElementById('btn-ask-soilgold');
    const soilgoldInput = document.getElementById('soilgold-query');
    const soilgoldResults = document.getElementById('soilgold-results');

    soilgoldBtn.addEventListener('click', async () => {
        const query = soilgoldInput.value;
        if (!query) return;

        soilgoldResults.classList.remove('hidden');
        soilgoldResults.innerHTML = `<div class="p-24 shimmer">AI Calculating Organic Intelligence...</div>`;

        try {
            const prompt = `You are BHUMIIQ Soil Scientist. User has this waste: "${query}". 
            Explain:
            - Best way to turn this into organic fertilizer/compost.
            - Time required.
            - Benefits for the plant.
            - Safety precautions.
            Answer in English and Hindi.`;

            const payload = { contents: [{ parts: [{ text: prompt }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            const reply = data.candidates[0].content.parts[0].text;

            soilgoldResults.innerHTML = `
                <div class="p-24">
                    <h4 style="color:var(--brand-emerald); margin-bottom:12px;">SoilGold Recovery Plan</h4>
                    <div style="font-size:14px; line-height:1.6;">${reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                </div>
            `;
        } catch (e) {
            soilgoldResults.innerHTML = `<p class="p-24">Error consulting Advisor.</p>`;
        }
    });

    /* ===============================
       5. MANDI PRICES
       =============================== */
    const mandiPreviewBtn = document.getElementById('mandi-search-btn');
    const mandiResults = document.getElementById('mandi-results');

    mandiPreviewBtn.addEventListener('click', async () => {
        const state = document.getElementById('mandi-state').value;
        const comm = document.getElementById('mandi-comm').value;
        if (!state || !comm) { alert("Select State & Crop"); return; }

        mandiResults.innerHTML = `<div class="p-24 shimmer" style="border-radius:24px;">Gathering Market Intelligence...</div>`;

        try {
            const prompt = `BHUMIIQ Market Analysis: Predict price trends for ${comm} in ${state}. Suggest best selling window. English/Hindi.`;
            const payload = { contents: [{ parts: [{ text: prompt }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            const replyText = data.candidates[0].content.parts[0].text;

            mandiResults.innerHTML = `
                <div class="glass-card p-24 text-left">
                    <h4 style="color:var(--brand-emerald); margin-bottom:12px;">Market Prediction</h4>
                    <div style="font-size:14px; line-height:1.6;">${replyText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                </div>
            `;
        } catch (e) {
            mandiResults.innerHTML = "Price Intelligence Offline.";
        }
    });

    const mandiResetBtn = document.getElementById('mandi-reset-btn');
    mandiResetBtn.addEventListener('click', () => {
        document.getElementById('mandi-state').value = "";
        document.getElementById('mandi-comm').value = "";
        mandiResults.innerHTML = `<p class="text-center" style="color: #666; font-size: 14px;">Results will appear here...</p>`;
    });

    /* ===============================
       6. VOICE ASSISTANT (Gemma AI)
       =============================== */
    const voiceBtn = document.getElementById('voice-btn');
    const chatContainer = document.getElementById('chat-container');
    let recognition = null;
    let isListening = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.onstart = () => { isListening = true; voiceBtn.style.background = '#10B981'; };
        recognition.onresult = async (e) => {
            const text = e.results[0][0].transcript;
            appendChat('User', text);
            await askVoiceGemini(text);
        };
        recognition.onend = () => { isListening = false; voiceBtn.style.background = '#06402B'; };
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
        } catch (e) { appendChat('BHUMIIQ', 'क्षमा करें, नेटवर्क त्रुटि।'); }
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
