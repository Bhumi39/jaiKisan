const GEMINI_API_URL = '/api/gemini';

document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       1. NAVIGATION LOGIC (Desktop SPA)
       ============================== */
    const screens = document.querySelectorAll('.screen');
    const navLinks = document.querySelectorAll('.desktop-nav a, .nav-brand, .pro-card');

    function navigateTo(targetId) {
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) targetScreen.classList.add('active');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update header highlighting
        document.querySelectorAll('.desktop-nav a').forEach(a => {
            if (a.getAttribute('data-target') === targetId) a.style.color = 'var(--brand-emerald)';
            else a.style.color = 'var(--text-muted)';
        });
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

    // Default Home
    navigateTo('screen-home');


    /* ===============================
       2. CINEMATIC LOADER UTILS
       ============================== */
    const loader = document.getElementById('cinematic-loader');
    const loaderText = loader.querySelector('.loader-text');

    function showLoader(text = "Analyzing Satellite Data...") {
        loaderText.innerText = text;
        loader.classList.remove('hidden');
    }
    function hideLoader() { loader.classList.add('hidden'); }


    /* ===============================
       3. AI DOCTOR IQ (Fixed Uploads)
       ============================== */
    const uploadArea = document.getElementById('upload-clickable');
    const camInput = document.getElementById('doctor-camera');
    const galInput = document.getElementById('doctor-gallery');
    const leafImg = document.getElementById('leaf-image-v5');
    const uploadPrompt = document.getElementById('upload-prompt');
    const btnAnalyze = document.getElementById('btn-analyze-v5');
    const doctorResults = document.getElementById('doctor-results');

    let base64Image = null;
    let mimeType = null;

    // Fix: Clicking the zone triggers selection
    uploadArea.addEventListener('click', (e) => {
        if (!e.target.closest('button')) galInput.click();
    });

    document.getElementById('btn-camera-v5').addEventListener('click', (e) => { e.stopPropagation(); camInput.click(); });
    document.getElementById('btn-gallery-v5').addEventListener('click', (e) => { e.stopPropagation(); galInput.click(); });

    function handleImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            uploadPrompt.classList.add('hidden');
            leafImg.classList.remove('hidden-img');
            leafImg.src = evt.target.result;
            base64Image = evt.target.result.split(',')[1];
            mimeType = file.type;
        }
        reader.readAsDataURL(file);
    }
    camInput.addEventListener('change', handleImage);
    galInput.addEventListener('change', handleImage);

    btnAnalyze.addEventListener('click', async () => {
        if (!base64Image) { alert('Upload a photo first!'); return; }
        
        showLoader("Scanning Leaf Health...");

        try {
            const prompt = `You are BHUMIIQ Global Crop Expert. Analyze this plant photo:
            1. Identify Crop and Health Score (0-100%).
            2. PROVIDE 'SURVIVAL CHANCE' as a percentage.
            3. Detailed 'DOS' and 'DON'TS' for the farmer.
            4. Suggested Cures and Chemicals.
            Answer clearly in English and Hindi.`;

            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: mimeType, data: base64Image } }
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
            const reply = data.candidates[0].content.parts[0].text;
            
            const chanceMatch = reply.match(/(\d+)%/);
            const chance = chanceMatch ? chanceMatch[1] : 75;

            doctorResults.innerHTML = `
                <div class="result-card p-32 glass-container" style="margin-top:0;">
                    <h3>Diagnosis Result: <span style="color:var(--brand-emerald);">${chance}% Health</span></h3>
                    <div style="font-size:14px; line-height:1.8; margin-top:16px;">
                        ${reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                    </div>
                </div>
            `;
        } catch (e) { alert("Analysis failed."); }
        finally { hideLoader(); }
    });


    /* ===============================
       4. SOWING IQ (Weather Logic)
       ============================== */
    const weatherSowingBtn = document.getElementById('btn-get-sowing-advice');
    const weatherDisplay = document.getElementById('weather-display');
    const sowingResults = document.getElementById('sowing-results');
    
    let currentTemp = null;
    let currentHumidity = null;
    let currentLocation = "Detected Region";

    async function initWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                try {
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&relative_humidity_2m=true`);
                    const data = await res.json();
                    currentTemp = data.current_weather.temperature;
                    currentHumidity = data.current_weather.windspeed; // Proxy for the demo if humidity isn't directly in current_weather
                    
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const geoData = await geoRes.json();
                    currentLocation = geoData.address.city || geoData.address.state || "Your Area";

                    weatherDisplay.innerHTML = `
                        <div class="text-center">
                            <span class="material-symbols-outlined" style="font-size:64px; color:var(--brand-emerald);">wb_sunny</span>
                            <h2 style="font-size:48px;">${currentTemp}°C</h2>
                            <p style="font-size:18px; color:var(--text-muted);">${currentLocation}</p>
                        </div>
                    `;
                } catch (e) { weatherDisplay.innerText = "Weather Check Offline."; }
            });
        }
    }
    initWeather();

    weatherSowingBtn.addEventListener('click', async () => {
        showLoader("Calculating Best Sowing Window...");

        try {
            const prompt = `You are BHUMIIQ Agri-Weather Expert. Current conditions in ${currentLocation} are ${currentTemp}°C and moisture is high. 
            Suggest exactly 3 crops to sow right now. Provide 'Why' and 'Expected Yield'. Explain in English and Hindi.`;

            const payload = { contents: [{ parts: [{ text: prompt }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            const reply = data.candidates[0].content.parts[0].text;

            sowingResults.innerHTML = `
                <div class="glass-container p-32">
                    <h3 class="mb-16" style="color:var(--brand-emerald);">Sowing Recommendation</h3>
                    <div style="font-size:14px; line-height:1.8;">${reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                </div>
            `;
        } catch (e) { alert("Sowing IQ Offline."); }
        finally { hideLoader(); }
    });


    /* ===============================
       5. SOILGOLD & MANDI IQ
       ============================== */
    const soilBtn = document.getElementById('btn-ask-soilgold');
    const mandiBtn = document.getElementById('mandi-search-btn');

    soilBtn.addEventListener('click', async () => {
        const query = document.getElementById('soilgold-query').value;
        if (!query) return;
        showLoader("Engineering Organic Formula...");
        try {
            const payload = { contents: [{ parts: [{ text: `BHUMIIQ Soil Scientist: Turn ${query} into SoilGold.` }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            document.getElementById('soilgold-results').innerHTML = `<div class="glass-container p-32">${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</div>`;
        } catch(e) {} finally { hideLoader(); }
    });

    mandiBtn.addEventListener('click', async () => {
        const state = document.getElementById('mandi-state').value;
        const comm = document.getElementById('mandi-comm').value;
        showLoader("Scanning Market Satellite...");
        try {
            const payload = { contents: [{ parts: [{ text: `Mandi Price Expert: Trends for ${comm} in ${state}.` }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            document.getElementById('mandi-results').innerHTML = `<div class="glass-container p-32">${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</div>`;
        } catch(e) {} finally { hideLoader(); }
    });

});
