const GEMINI_API_URL = '/api/gemini';

document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       1. MULTI-PAGE NAVIGATION IQ
       ============================== */
    const screens = document.querySelectorAll('.screen');
    const navLinks = document.querySelectorAll('[data-target]');
    const backBtn = document.getElementById('back-home-btn');
    const navbar = document.querySelector('.main-header');

    function navigateTo(targetId) {
        if (!targetId) return;
        
        // Handle transitions
        screens.forEach(s => {
            s.classList.remove('active');
            s.style.opacity = '0';
        });

        const targetScreen = document.getElementById(targetId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            setTimeout(() => targetScreen.style.opacity = '1', 50);
        }

        // Toggle Back Button & Header Style
        if (targetId === 'screen-home') {
            backBtn.classList.add('hidden');
            navbar.style.background = "rgba(255, 255, 255, 0.9)";
        } else {
            backBtn.classList.remove('hidden');
            navbar.style.background = "white";
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

    // Smooth scroll for internal anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#section')) {
                e.preventDefault();
                const targetEl = document.querySelector(href);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Default Starting View
    navigateTo('screen-home');


    /* ===============================
       2. CINEMATIC LOADER
       ============================== */
    const loader = document.getElementById('cinematic-loader');
    function showLoader(txt) { 
        loader.querySelector('.loader-text').innerText = txt; 
        loader.classList.remove('hidden'); 
    }
    function hideLoader() { loader.classList.add('hidden'); }


    /* ===============================
       3. AI DOCTOR IQ (Bilingual Roadmap)
       ============================== */
    const uploadArea = document.getElementById('upload-clickable');
    const analyzeBtn = document.getElementById('btn-analyze-v7');
    const resultsArea = document.getElementById('doctor-results-v7');
    const galInput = document.getElementById('doctor-gallery');
    const previewImg = document.getElementById('leaf-image-v7');
    const promptBox = document.getElementById('upload-prompt');

    let base64Data = null;
    let mimeType = null;

    uploadArea.addEventListener('click', () => galInput.click());

    galInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            promptBox.classList.add('hidden');
            previewImg.classList.remove('hidden-img-v7');
            previewImg.src = evt.target.result;
            base64Data = evt.target.result.split(',')[1];
            mimeType = file.type;
        };
        reader.readAsDataURL(file);
    });

    analyzeBtn.addEventListener('click', async () => {
        if (!base64Data) return alert("Please upload a leaf image first.");
        showLoader("Generating Bilingual Expert Roadmap...");

        const prompt = `You are BHUMIIQ Pro Global Expert. Analyze this plant photo:
        1. MANDATORY: FOR EVERY SINGLE SENTENCE, PROVIDE ENGLISH THEN THE HINDI TRANSLATION (हिंदी अनुवाद).
        2. Diagnosis Summary (Bilingual).
        3. HEALTH SCORE PERCENTAGE (0-100%).
        4. BILINGUAL Dos & Don'ts list.
        5. FERTILIZER IQ PORTFOLIO: Provide exactly 10 suggested treatments/cures. Explain exactly how to apply each.
        Format this as a stunning enterprise roadmap report.`;

        try {
            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: base64Data } }
                    ]
                }],
                type: 'vision'
            };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            const reply = data.candidates[0].content.parts[0].text;

            const chanceMatch = reply.match(/(\d+)%/);
            const chance = chanceMatch ? chanceMatch[1] : 85;

            resultsArea.innerHTML = `
                <div class="roadmap-result">
                    <div class="service-card mb-32" style="border-left:10px solid var(--brand-emerald)">
                         <h3 class="mb-12">Health IQ Check: ${chance}% Survival</h3>
                         <div class="survival-chance-bar"><div class="survival-progress" style="width:${chance}%"></div></div>
                    </div>
                    
                    <div class="service-card py-40">
                        <h4 class="mb-24" style="color:var(--brand-emerald)">Expert Analysis (Bilingual)</h4>
                        <div class="roadmap-body" style="font-size:15px; line-height:1.8;">
                            ${reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--brand-primary); font-size:17px; display:block; margin-top:10px;">$1</strong>')}
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            resultsArea.innerHTML = `<p class="text-danger">Intelligence connection error. Please try again.</p>`;
        } finally {
            hideLoader();
        }
    });


    /* ===============================
       4. SOWING IQ (Workspace)
       ============================== */
    const getSowingBtn = document.getElementById('btn-get-sowing-v7');
    const sowingResult = document.getElementById('sowing-results-v7');

    async function initWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true`);
                    const data = await res.json();
                    document.getElementById('weather-display-v7').innerHTML = `
                        <h2 style="font-size:64px; color:var(--brand-emerald); font-weight:900;">${data.current_weather.temperature}°C</h2>
                        <p style="font-weight:700; opacity:0.7;">Detected Local Climate</p>
                    `;
                } catch(e) {}
            });
        }
    }
    initWeather();

    getSowingBtn.addEventListener('click', async () => {
        showLoader("Calculating Sowing Windows...");
        try {
            const prompt = `Based on current climate, provide a bilingual (English/Hindi) report for 3 ideal crops to sow right now to maximize yield.`;
            const payload = { contents: [{ parts: [{ text: prompt }] }], type: 'text' };
            const res = await fetch(GEMINI_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const data = await res.json();
            sowingResult.innerHTML = `<div class="service-card p-40">${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</div>`;
        } catch(e) {} finally { hideLoader(); }
    });

    /* ===============================
       5. CONTACT FORM MOCKUP
       ============================== */
    const submitBtn = document.querySelector('#section-contact .btn-primary');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            alert("Success! Your farm transformation request has been sent to Aman Kumar's team. We will contact you at +91 6206000925 shortly.");
        });
    }

});
