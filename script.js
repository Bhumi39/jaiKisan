const GEMINI_API_URL = '/api/gemini';

document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       1. NAVIGATION LOGIC (Desktop SPA)
       ============================== */
    const screens = document.querySelectorAll('.screen');
    const navLinks = document.querySelectorAll('.desktop-nav a, .nav-brand, .service-card, .tool-card');

    function navigateTo(targetId, title) {
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) targetScreen.classList.add('active');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update header highlighting if needed
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
       2. FARMING TOOLS (Calculator Logic)
       ============================== */
    const calcContainer = document.getElementById('calculator-ui');
    const calcTitle = document.getElementById('tool-calc-title');
    const calcBtn = document.getElementById('btn-calc-run');
    const calcResults = document.getElementById('calc-results');

    const toolConfig = {
        fertilizer: {
            title: "Fertilizer Requirement Calculator",
            fields: ['Crop Type (फसल)', 'Land Area (Acres)', 'Soil Type (मिट्टी)'],
            prompt: "Calculate required Nitrogen, Phosphorus, and Potassium for [CROP] in [AREA] acres of [SOIL] soil. Give a precise table."
        },
        yield: {
            title: "Crop Yield Estimator",
            fields: ['Crop Type', 'Seeds used (kg)', 'Current Growth Month'],
            prompt: "Estimate the harvest yield (in quintals) for [CROP] given [SEEDS] kg of seeds planted."
        },
        irrigation: {
            title: "Irrigation Schedule Planner",
            fields: ['Crop Type', 'Last Rain (Days ago)', 'Soil Moisture level'],
            prompt: "Suggest an irrigation schedule for [CROP] based on [MOISTURE] moisture and [RAIN] days since last rain."
        },
        cost: {
            title: "Farm Expense & Cost Manager",
            fields: ['Crop Type', 'Seed Cost', 'Labor Cost', 'Fertilizer Cost'],
            prompt: "Analyze the total investment and suggest ways to reduce input costs for [CROP]."
        }
    };

    let activeTool = 'fertilizer';

    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const toolKey = card.getAttribute('data-tool');
            activeTool = toolKey;
            setupCalculator(toolKey);
            navigateTo('screen-tools');
        });
    });

    function setupCalculator(key) {
        const config = toolConfig[key];
        calcTitle.innerText = config.title;
        calcResults.innerHTML = "";
        
        calcContainer.innerHTML = config.fields.map(f => `
            <div class="mb-16">
                <label class="block mb-8 font-bold">${f}</label>
                <input type="text" class="form-input calc-field" placeholder="Enter ${f}...">
            </div>
        `).join('');
    }

    calcBtn.addEventListener('click', async () => {
        const values = Array.from(document.querySelectorAll('.calc-field')).map(i => i.value);
        if (values.some(v => !v)) { alert("Please fill all fields!"); return; }

        calcResults.innerHTML = `<div class="shimmer p-24" style="border-radius:16px;">Processing AI Calculation...</div>`;

        try {
            const config = toolConfig[activeTool];
            const query = `Analyze this farming data for ${config.title}: ${values.join(', ')}. Provide a detailed report in English and Hindi.`;
            
            const payload = { contents: [{ parts: [{ text: query }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            const reply = data.candidates[0].content.parts[0].text;

            calcResults.innerHTML = `
                <div class="p-24 glass-card" style="border-left: 4px solid var(--brand-emerald);">
                    <div style="font-size:14px; line-height:1.8;">${reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                </div>
            `;
        } catch (e) { calcResults.innerHTML = "Error in calculation."; }
    });


    /* ===============================
       3. AI PLANT DOCTOR (Vision IQ)
       ============================== */
    const cameraInput = document.getElementById('camera-input');
    const galleryInput = document.getElementById('gallery-input');
    const leafImage = document.getElementById('leaf-image');
    const btnAnalyze = document.getElementById('btn-analyze');
    const aiPhotoResult = document.getElementById('ai-photo-result');

    let base64ImageString = null;
    let imageMimeType = null;

    document.getElementById('btn-camera').addEventListener('click', () => cameraInput.click());
    document.getElementById('btn-gallery').addEventListener('click', () => galleryInput.click());

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            document.getElementById('img-placeholder-icon').classList.add('hidden');
            document.getElementById('img-placeholder-text').classList.add('hidden');
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
        if (!base64ImageString) { alert('Upload a photo first!'); return; }

        aiPhotoResult.classList.remove('hidden');
        aiPhotoResult.innerHTML = `<div class="shimmer p-40" style="border-radius:24px;">Diagnosing Crop Health...</div>`;

        try {
            const prompt = `You are BHUMIIQ Global Crop Expert. Analyze this plant photo:
            1. Identify Crop and Health Score (0-100%).
            2. PROVIDE 'SURVIVAL CHANCE' as a percentage.
            3. Detailed 'DOS' (Green Card) and 'DON'TS' (Red Card) for the farmer.
            4. Suggested Cures and Chemicals.
            Answer clearly in English and Hindi.`;

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
            
            const chanceMatch = replyText.match(/(\d+)%/);
            const chance = chanceMatch ? chanceMatch[1] : 75;

            aiPhotoResult.innerHTML = `
                <div class="p-32 glass-card">
                    <div class="mb-24">
                        <h3 class="mb-8">Health IQ Result: <span style="color:var(--brand-emerald);">${chance}% Survival</span></h3>
                        <div class="survival-chance-bar"><div class="survival-progress" style="width:${chance}%"></div></div>
                    </div>
                    
                    <div class="dos-donts-grid">
                        <div class="card-do">
                            <h5><span class="material-symbols-outlined">check_circle</span> DO'S / क्या करें</h5>
                            <div style="font-size:13px; line-height:1.6;">${replyText.split(/DON'TS|क्या न करें/i)[0].replace(/\n/g, '<br>')}</div>
                        </div>
                        <div class="card-dont">
                            <h5><span class="material-symbols-outlined">cancel</span> DON'TS / क्या न करें</h5>
                            <div style="font-size:13px; line-height:1.6;">${replyText.includes("DON'TS") ? replyText.split(/DON'TS|क्या न करें/i)[1].replace(/\n/g, '<br>') : "Avoid over-irrigation."}</div>
                        </div>
                    </div>

                    <div class="mt-32 p-24" style="background:#F0FDF4; border-radius:16px;">
                        <h4 class="mb-12">Expert Cures & Recommendations</h4>
                        <div style="font-size:14px;">${replyText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
                        <button class="btn btn-primary mt-16 btn-pill" id="btn-listen-doctor"><span class="material-symbols-outlined">volume_up</span> Listen Report</button>
                    </div>
                </div>
            `;

            document.getElementById('btn-listen-doctor').addEventListener('click', () => speakText(replyText));

        } catch (error) { aiPhotoResult.innerHTML = `<p class="p-40 text-center">Connection Error.</p>`; }
    });

    /* ===============================
       4. SOILGOLD & MANDI PRICE
       ============================== */
    const soilgoldBtn = document.getElementById('btn-ask-soilgold');
    const mandiBtn = document.getElementById('mandi-search-btn');

    soilgoldBtn.addEventListener('click', async () => {
        const query = document.getElementById('soilgold-query').value;
        if (!query) return;
        const results = document.getElementById('soilgold-results');
        results.innerHTML = `<div class="shimmer p-24">Consulting Scientist...</div>`;
        try {
            const payload = { contents: [{ parts: [{ text: `You are BHUMIIQ Soil Specialist. Answer: ${query}` }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            results.innerHTML = `<div class="p-24 glass-card mt-16">${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</div>`;
        } catch(e) { results.innerHTML = "Error."; }
    });

    mandiBtn.addEventListener('click', async () => {
        const state = document.getElementById('mandi-state').value;
        const comm = document.getElementById('mandi-comm').value;
        if (!state || !comm) return;
        const results = document.getElementById('mandi-results');
        results.innerHTML = `<div class="shimmer p-24">Analyzing Market Satellite Data...</div>`;
        try {
            const payload = { contents: [{ parts: [{ text: `Predict current price trends for ${comm} in ${state}.` }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            results.innerHTML = `<div class="p-24 glass-card mt-16">${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</div>`;
        } catch(e) { results.innerHTML = "Market offline."; }
    });

    function speakText(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN';
            window.speechSynthesis.speak(utterance);
        }
    }
});
