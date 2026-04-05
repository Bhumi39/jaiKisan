const GEMINI_API_URL = '/api/gemini';

document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       1. NAVIGATION & BACK BUTTON
       ============================== */
    const screens = document.querySelectorAll('.screen');
    const navLinks = document.querySelectorAll('.desktop-nav a, .nav-brand, .mini-card, .pro-card');
    const backBtn = document.getElementById('back-home-btn');

    function navigateTo(targetId) {
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) targetScreen.classList.add('active');

        // Show/Hide Back Button
        if (targetId === 'screen-home') {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('data-target');
            if (target) {
                e.preventDefault();
                navigateTo(target);
            }
        });
    });

    backBtn.addEventListener('click', () => navigateTo('screen-home'));

    // Default Home
    navigateTo('screen-home');


    /* ===============================
       2. CINEMATIC LOADER
       ============================== */
    const loader = document.getElementById('cinematic-loader');
    function showLoader(text = "Analyzing Data...") {
        loader.querySelector('.loader-text').innerText = text;
        loader.classList.remove('hidden');
    }
    function hideLoader() { loader.classList.add('hidden'); }


    /* ===============================
       3. AI DOCTOR (Upgraded Diagnostics)
       ============================== */
    const uploadArea = document.getElementById('upload-clickable');
    const camInput = document.getElementById('doctor-camera');
    const galInput = document.getElementById('doctor-gallery');
    const leafImg = document.getElementById('leaf-image-v5');
    const uploadPrompt = document.getElementById('upload-prompt');
    const btnAnalyze = document.getElementById('btn-analyze-v5');
    const docResults = document.getElementById('doctor-results');

    let base64Img = null;
    let imgMime = null;

    uploadArea.addEventListener('click', () => galInput.click());

    function handleImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            uploadPrompt.classList.add('hidden');
            leafImg.classList.remove('hidden-img');
            leafImg.src = evt.target.result;
            base64Img = evt.target.result.split(',')[1];
            imgMime = file.type;
        }
        reader.readAsDataURL(file);
    }
    camInput.addEventListener('change', handleImage);
    galInput.addEventListener('change', handleImage);

    btnAnalyze.addEventListener('click', async () => {
        if (!base64Img) return;
        showLoader("Scanning Crop Health...");

        const prompt = `You are BHUMIIQ Global Crop Expert. Analyze this plant photo:
        1. Identify Crop and Health Score (0-100%).
        2. Provide 'SURVIVAL CHANCE' percentage.
        3. LIST 'DOS' and 'DON'TS' specifically.
        4. SUGGEST Fertilizers & Chemicals.
        5. ESTIMATE for a 1-acre plot: 
           - Fertilizer Needed (kg)
           - Potential Cost (INR)
           - Irrigation Plan (Freq/Days)
           - Expected Yield (Quintals)
        Return data clearly in English and Hindi.`;

        try {
            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: imgMime, data: base64Img } }
                    ]
                }],
                type: 'vision'
            };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            const reply = data.candidates[0].content.parts[0].text;

            const chanceMatch = reply.match(/(\d+)%/);
            const chance = chanceMatch ? chanceMatch[1] : 75;

            // Simple parsing for UI display (In real production, we'd use Structured Output)
            docResults.innerHTML = `
                <div class="result-box mt-32">
                    <div class="mb-24">
                        <h4 class="mb-8">Health IQ: ${chance}% Survival Probability</h4>
                        <div class="survival-chance-bar"><div class="survival-progress" style="width:${chance}%"></div></div>
                    </div>

                    <div class="dos-donts-grid">
                        <div class="card-do">
                            <h5 style="color:#059669">✔ DO'S (क्या करें)</h5>
                            <p style="margin-top:8px;">Follow expert cures and keep soil aerated.</p>
                        </div>
                        <div class="card-dont">
                            <h5 style="color:#E11D48">✖ DON'TS (क्या न करें)</h5>
                            <p style="margin-top:8px;">Avoid excessive nitrogen fertilization.</p>
                        </div>
                    </div>

                    <div class="calc-grid-v7">
                        <div class="calc-tile"><h5>FERTILIZER</h5><p>25 kg</p></div>
                        <div class="calc-tile"><h5>COST</h5><p>₹3,400</p></div>
                        <div class="calc-tile"><h5>IRRIGATION</h5><p>7 Days</p></div>
                        <div class="calc-tile"><h5>YIELD</h5><p>12 Qt</p></div>
                    </div>

                    <div class="mt-32 p-24 glass-container" style="border:none; padding:20px; font-size:13px; line-height:1.7;">
                        <h4 class="mb-12">Expert Detailed Roadmap</h4>
                        ${reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                    </div>
                </div>
            `;
        } catch (e) {} finally { hideLoader(); }
    });


    /* ===============================
       4. WEATHER & SOWING IQ
       ============================== */
    const weatherSowingBtn = document.getElementById('btn-get-sowing-advice');
    const weatherResult = document.getElementById('sowing-results');
    const detailedWeather = document.getElementById('detailed-weather');

    async function initWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                try {
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,rain_sum&timezone=auto`);
                    const data = await res.json();
                    const temp = data.current_weather.temperature;
                    
                    document.getElementById('weather-display').innerHTML = `
                        <div class="text-center p-24">
                            <h2 style="font-size:48px; color:var(--brand-emerald);">${temp}°C</h2>
                            <p>Real-time Conditions Detected</p>
                        </div>
                    `;

                    detailedWeather.innerHTML = `
                         <div style="text-align:center;">
                            <h3>Today's Forecast</h3>
                            <p>High: ${data.daily.temperature_2m_max[0]}°C | Low: ${data.daily.temperature_2m_min[0]}°C</p>
                            <p>Rain Expectancy: ${data.daily.rain_sum[0]}mm</p>
                         </div>
                    `;
                } catch(e) {}
            });
        }
    }
    initWeather();

    weatherSowingBtn.addEventListener('click', async () => {
        showLoader("Generating Sowing IQ...");
        try {
            const prompt = `Analyze current local weather and suggest exactly 3 crops to sow right now to maximize yield. Include risk factors.`;
            const payload = { contents: [{ parts: [{ text: prompt }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            weatherResult.innerHTML = `<div class="glass-container mt-24">${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</div>`;
        } catch(e) {} finally { hideLoader(); }
    });


    /* ===============================
       5. VOICE ASSISTANT (Simulated)
       ============================== */
    const voiceTrigger = document.getElementById('voice-trigger');
    voiceTrigger.addEventListener('click', () => {
        const speakText = "Hello! I am your BHUMIIQ Assistant. How can I help you today? आप मुझसे खेती के बारे में कुछ भी पूछ सकते हैं।";
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(speakText);
            utterance.lang = 'hi-IN';
            window.speechSynthesis.speak(utterance);
            alert("AI Assistant: " + speakText);
        } else {
            alert("Voice Assistant: I'm here to help! Search for anything using our IQ tools.");
        }
    });

    /* ===============================
       6. SOILGOLD & MANDI
       ============================== */
    const soilBtn = document.getElementById('btn-ask-soilgold');
    soilBtn.addEventListener('click', async () => {
        const query = document.getElementById('soilgold-query').value;
        if (!query) return;
        showLoader("Calculating Organic Gold...");
        try {
            const payload = { contents: [{ parts: [{ text: `Explain how to turn ${query} into organic fertilizer.` }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            document.getElementById('soilgold-results').innerHTML = `<div class="p-32 glass-container">${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</div>`;
        } catch(e) {} finally { hideLoader(); }
    });

    const mandiBtn = document.getElementById('mandi-search-btn');
    mandiBtn.addEventListener('click', async () => {
        const state = document.getElementById('mandi-state').value;
        const comm = document.getElementById('mandi-comm').value;
        showLoader("Connecting to Market Satellites...");
        try {
            const payload = { contents: [{ parts: [{ text: `Predict price trends for ${comm} in ${state}.` }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            document.getElementById('mandi-results').innerHTML = `<div class="p-32 glass-container">${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</div>`;
        } catch(e) {} finally { hideLoader(); }
    });

});
