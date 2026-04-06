const API_URL = '/api/gemini';

document.addEventListener('DOMContentLoaded', () => {

    /* ===================================================
       1. SPA NAVIGATION + BACK BUTTON
    =================================================== */
    const screens = document.querySelectorAll('.screen');
    const allNavLinks = document.querySelectorAll('[data-target]');
    const backBtn = document.getElementById('back-home-btn');

    function goTo(id) {
        if (!id) return;
        screens.forEach(s => s.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
        backBtn.classList.toggle('hidden', id === 'screen-home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    allNavLinks.forEach(el => el.addEventListener('click', e => {
        const t = el.dataset.target;
        if (t) { e.preventDefault(); goTo(t); }
    }));

    backBtn.addEventListener('click', () => goTo('screen-home'));
    goTo('screen-home');


    /* ===================================================
       2. SCROLL REVEAL (IntersectionObserver)
    =================================================== */
    const reveals = document.querySelectorAll('.reveal-up');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); } });
    }, { threshold: 0.12 });
    reveals.forEach(el => revealObserver.observe(el));


    /* ===================================================
       3. PROGRESSIVE CINEMATIC LOADER
    =================================================== */
    const loader = document.getElementById('cinematic-loader');
    const loaderStatus = document.getElementById('loader-status-text');
    const loaderSub = document.getElementById('loader-sub-text');
    const progressFill = loader.querySelector('.progress-fill');

    const scanSteps = [
        [10, 'Capturing Leaf Structure...', 'पत्ती की संरचना पहचान रहे हैं...'],
        [30, 'Analyzing Chlorophyll Levels...', 'क्लोरोफिल स्तर विश्लेषण...'],
        [55, 'Detecting Pathogens & Pests...', 'रोगाणु और कीटों की पहचान...'],
        [75, 'Calculating Survival Probability...', 'जीवित रहने की संभावना गणना...'],
        [90, 'Preparing Bilingual Roadmap...', 'द्विभाषी रोडमैप तैयार हो रहा है...'],
        [100, 'Intelligence Ready!', 'विश्लेषण पूर्ण!']
    ];
    let stepTimer;

    function showLoader() {
        loader.classList.remove('hidden');
        progressFill.style.width = '0%';
        let i = 0;
        stepTimer = setInterval(() => {
            if (i >= scanSteps.length) { clearInterval(stepTimer); return; }
            const [pct, en, hi] = scanSteps[i];
            progressFill.style.width = pct + '%';
            loaderStatus.textContent = en;
            loaderSub.textContent = hi;
            i++;
        }, 600);
    }
    function hideLoader() {
        clearInterval(stepTimer);
        loader.classList.add('hidden');
        progressFill.style.width = '0%';
    }


    /* ===================================================
       4. AI CROP SCAN (Gemini Vision)
    =================================================== */
    const uploadArea = document.getElementById('upload-clickable');
    const galInput = document.getElementById('doctor-gallery');
    const leafImg = document.getElementById('leaf-image-v9');
    const uploadPrompt = document.getElementById('upload-prompt-v9');
    const analyzeBtn = document.getElementById('btn-analyze-v9');
    const resultsBox = document.getElementById('doctor-results-v9');

    let imgBase64 = null, imgMime = null;

    uploadArea.addEventListener('click', () => galInput.click());

    galInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            imgBase64 = evt.target.result.split(',')[1];
            imgMime = file.type;
            uploadPrompt.style.display = 'none';
            leafImg.src = evt.target.result;
            leafImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });

    analyzeBtn.addEventListener('click', async () => {
        if (!imgBase64) {
            resultsBox.innerHTML = `<div style="padding:24px;background:#FFF1F2;border-radius:16px;color:#9F1239;font-weight:700;">Please upload a leaf image first.</div>`;
            return;
        }
        showLoader();
        resultsBox.innerHTML = '';

        const prompt = `You are BHUMIIQ, the world's most advanced crop intelligence system. Analyze this plant image and provide a professional diagnosis structured as follows:

**DISEASE NAME:** (Name in English)
**रोग का नाम:** (Same name in Hindi)

**DIAGNOSIS SUMMARY:**
(2-3 sentences in English)
**निदान सारांश:**
(Same 2-3 sentences in Hindi)

**SURVIVAL CHANCE:** [X]% (give a number from 0-100)
**जीवित रहने की संभावना:** [X]%

**DO'S (क्या करें):**
- Do 1 (English) | हिंदी अनुवाद
- Do 2 (English) | हिंदी अनुवाद
- Do 3 (English) | हिंदी अनुवाद
- Do 4 (English) | हिंदी अनुवाद

**DON'TS (क्या न करें):**
- Don't 1 (English) | हिंदी अनुवाद
- Don't 2 (English) | हिंदी अनुवाद
- Don't 3 (English) | हिंदी अनुवाद
- Don't 4 (English) | हिंदी अनुवाद

**FERTILIZER & TREATMENT PORTFOLIO (10 options):**
1. [Name] - [How to apply, when, quantity] (Organic/Chemical label)
2. [Name] - [How to apply, when, quantity]
3. [Name] - [How to apply, when, quantity]
4. [Name] - [How to apply, when, quantity]
5. [Name] - [How to apply, when, quantity]
6. [Name] - [How to apply, when, quantity]
7. [Name] - [How to apply, when, quantity]
8. [Name] - [How to apply, when, quantity]
9. [Name] - [How to apply, when, quantity]
10. [Name] - [How to apply, when, quantity]

Follow this structure EXACTLY.`;

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'vision',
                    contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: imgMime, data: imgBase64 } }] }]
                })
            });

            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!raw) throw new Error('No response from intelligence engine.');

            renderResults(raw);
        } catch (err) {
            resultsBox.innerHTML = `
        <div style="padding:32px;background:#FFF1F2;border:2px solid #FECDD3;border-radius:20px;">
          <h4 style="color:#9F1239;margin-bottom:8px;">⚠ Intelligence Engine Error</h4>
          <p style="color:#BE123C;font-size:14px;">${err.message}</p>
          <p style="color:#BE123C;font-size:13px;margin-top:8px;">Check that your GEMINI_API_KEY is set in the .env file and the server is running.</p>
        </div>`;
        } finally {
            hideLoader();
        }
    });

    function renderResults(raw) {
        // Extract survival chance
        const survivalMatch = raw.match(/SURVIVAL CHANCE[:\s]*\[?(\d+)\]?%/i);
        const chance = survivalMatch ? parseInt(survivalMatch[1]) : 75;
        const chanceColor = chance >= 70 ? '#10B981' : chance >= 40 ? '#F59E0B' : '#EF4444';

        // Extract disease name
        const diseaseMatch = raw.match(/DISEASE NAME[:\s]*(.+)/i);
        const diseaseName = diseaseMatch ? diseaseMatch[1].trim() : 'Crop Health Analysis';

        // Extract Hindi disease name
        const hindiDiseaseMatch = raw.match(/रोग का नाम[:\s]*(.+)/i);
        const hindiDisease = hindiDiseaseMatch ? hindiDiseaseMatch[1].trim() : '';

        // Extract dos
        const dosMatch = raw.match(/DO'S[^:]*:([\s\S]*?)(?:DON'TS|$)/i);
        const dosText = dosMatch ? dosMatch[1].trim() : '';
        const dosItems = dosText.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim()).slice(0, 4);

        // Extract don'ts
        const dontsMatch = raw.match(/DON'TS[^:]*:([\s\S]*?)(?:FERTILIZER|$)/i);
        const dontsText = dontsMatch ? dontsMatch[1].trim() : '';
        const dontsItems = dontsText.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim()).slice(0, 4);

        // Extract fertilizers
        const fertMatch = raw.match(/FERTILIZER[^:]*PORTFOLIO[^:]*:([\s\S]*?)(?:\n\n\n|$)/i);
        const fertText = fertMatch ? fertMatch[1] : raw;
        const fertLines = fertText.split('\n').filter(l => /^\d+\./.test(l.trim())).slice(0, 10);

        resultsBox.innerHTML = `
      <div class="health-cert">
        <div class="cert-top">
          <div>
            <div style="font-size:12px;opacity:0.6;letter-spacing:1px;margin-bottom:4px;">BHUMIIQ INTELLIGENCE REPORT</div>
            <h3>${diseaseName}</h3>
            <div style="color:#6EE7B7;font-size:15px;font-family:'Noto Sans Devanagari',sans-serif;margin-top:4px;">${hindiDisease}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;opacity:0.6;letter-spacing:1px;margin-bottom:4px;">SURVIVAL CHANCE</div>
            <div class="score-badge" style="color:${chanceColor};">${chance}%</div>
          </div>
        </div>

        <div class="health-bar-wrap">
          <div class="health-bar-track">
            <div class="health-bar-fill" id="bar-fill" style="width:0%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;font-weight:700;color:#9CA3AF;">
            <span>Critical</span><span>Moderate</span><span>Healthy</span>
          </div>
        </div>

        <div class="cert-body">
          <div class="dos-donts">
            <div class="do-card">
              <h5>✅ DO'S — क्या करें</h5>
              <ul style="list-style:none;padding:0;">
                ${dosItems.map(d => `<li style="margin-bottom:10px;font-size:13px;">${d}</li>`).join('') || '<li>Follow expert recommendations below</li>'}
              </ul>
            </div>
            <div class="dont-card">
              <h5>❌ DON'TS — क्या न करें</h5>
              <ul style="list-style:none;padding:0;">
                ${dontsItems.map(d => `<li style="margin-bottom:10px;font-size:13px;">${d}</li>`).join('') || '<li>See full roadmap below</li>'}
              </ul>
            </div>
          </div>

          <div style="margin-top:32px;">
            <h4 style="font-size:18px;font-weight:900;color:#012A1A;margin-bottom:16px;">💊 Fertilizer & Treatment Portfolio</h4>
            <div class="fert-grid">
              ${fertLines.length > 0
                ? fertLines.map(f => {
                    const [num, ...rest] = f.split('.');
                    const [name, ...desc] = rest.join('.').split('-');
                    return `<div class="fert-item"><h5>${name?.trim() || f}</h5><p>${desc.join('-').trim() || 'Apply as directed'}</p></div>`;
                }).join('')
                : '<div class="fert-item" style="grid-column:span 2"><p>Full portfolio available in detailed roadmap below.</p></div>'
            }
            </div>
          </div>

          <div style="margin-top:32px;padding:32px;background:#F9FAFB;border-radius:20px;">
            <h4 style="font-size:16px;font-weight:900;color:#012A1A;margin-bottom:16px;">Full Intelligence Roadmap</h4>
            <div style="font-size:14px;line-height:1.9;color:#374151;">
              ${raw.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#012A1A;font-size:15px;">$1</strong>')}
            </div>
          </div>
        </div>
      </div>`;

        // Animate bar
        setTimeout(() => {
            const bar = document.getElementById('bar-fill');
            if (bar) bar.style.width = chance + '%';
        }, 200);
    }


    /* ===================================================
       5. WEATHER + SOWING IQ
    =================================================== */
    const weatherBox = document.getElementById('weather-display-v9');
    const sowingBtn = document.getElementById('btn-get-sowing-v9');
    const sowingResults = document.getElementById('sowing-results-v9');
    let currentWeatherContext = '';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async pos => {
            try {
                const { latitude: lat, longitude: lon } = pos.coords;
                const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,rain_sum&timezone=auto`);
                const d = await r.json();
                const cw = d.current_weather;
                const daily = d.daily;
                currentWeatherContext = `Temperature: ${cw.temperature}°C, Windspeed: ${cw.windspeed} km/h, Max: ${daily.temperature_2m_max[0]}°C, Min: ${daily.temperature_2m_min[0]}°C, Rain: ${daily.rain_sum[0]}mm`;

                weatherBox.classList.remove('shimmer');
                weatherBox.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;text-align:center;padding:20px;">
            <div>
              <div style="font-size:72px;font-weight:900;color:#10B981;">${cw.temperature}°C</div>
              <div style="font-size:14px;font-weight:700;color:#6B7280;margin-top:8px;">Current Temp</div>
            </div>
            <div>
              <div style="font-size:72px;font-weight:900;color:#F59E0B;">${daily.rain_sum[0] || 0}<span style="font-size:32px;">mm</span></div>
              <div style="font-size:14px;font-weight:700;color:#6B7280;margin-top:8px;">Rain Today</div>
            </div>
            <div>
              <div style="font-size:72px;font-weight:900;color:#3B82F6;">${cw.windspeed}<span style="font-size:32px;">km/h</span></div>
              <div style="font-size:14px;font-weight:700;color:#6B7280;margin-top:8px;">Wind Speed</div>
            </div>
          </div>`;
            } catch (e) {
                weatherBox.textContent = 'Could not load weather data.';
                weatherBox.classList.remove('shimmer');
            }
        }, () => {
            weatherBox.textContent = 'Location access denied.';
            weatherBox.classList.remove('shimmer');
        });
    }

    sowingBtn.addEventListener('click', async () => {
        showLoader();
        try {
            const prompt = `You are BHUMIIQ Sowing Advisor. Based on this weather: ${currentWeatherContext || 'current season conditions in India'},
recommend exactly 3 crops with high bilingual detail:
For each crop provide:
- Crop Name (English + Hindi)
- Why suitable for this weather
- Risk Factors
- Sowing Window
Answer in both English and Hindi for each point.`;

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'text', contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No results.';
            sowingResults.innerHTML = `
        <div class="sowing-result-card">
          ${reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#012A1A;">$1</strong>')}
        </div>`;
        } catch (e) {
            sowingResults.innerHTML = `<div style="padding:24px;background:#FFF1F2;border-radius:16px;color:#9F1239;font-weight:700;">Intelligence error. Please try again.</div>`;
        } finally {
            hideLoader();
        }
    });


    /* ===================================================
       6. LIVE VOICE ASSISTANT
    =================================================== */
    const voiceTrigger = document.getElementById('voice-trigger');
    const voiceModal = document.getElementById('voice-overlay');
    const voiceStatus = document.getElementById('voice-status');
    const voiceTranscript = document.getElementById('voice-transcript');
    const closeVoice = document.getElementById('close-voice');

    let recognition = null;
    const SpeechReco = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechReco) {
        recognition = new SpeechReco();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'hi-IN';

        recognition.onstart = () => {
            voiceStatus.textContent = '🎙️ Listening... बोलिए...';
            voiceTranscript.textContent = 'Ask anything about farming | खेती के बारे में पूछिए';
        };

        recognition.onresult = async e => {
            const q = e.results[0][0].transcript;
            voiceTranscript.textContent = `"${q}"`;
            voiceStatus.textContent = '🧠 Thinking...';

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'text',
                        contents: [{ parts: [{ text: `You are BHUMIIQ farming assistant. Answer in both English and Hindi (each sentence bilingual). Question: ${q}` }] }]
                    })
                });
                const data = await res.json();
                const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'नमस्ते! कृपया फसल के बारे में पूछें।';
                voiceStatus.textContent = '🌿 BHUMIIQ Speaking...';
                voiceTranscript.textContent = answer.substring(0, 300) + '...';
                speak(answer);
            } catch {
                voiceStatus.textContent = 'Connection Error';
            }
        };

        recognition.onerror = () => { voiceStatus.textContent = 'Mic error. Please allow microphone access.'; };
        recognition.onend = () => { if (voiceStatus.textContent === '🎙️ Listening... बोलिए...') voiceStatus.textContent = 'Done!'; };
    }

    function speak(text) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.substring(0, 500));
        u.lang = 'hi-IN'; u.rate = 0.9; u.pitch = 1.1;
        window.speechSynthesis.speak(u);
    }

    voiceTrigger.addEventListener('click', () => {
        voiceModal.classList.remove('hidden');
        if (recognition) {
            try { recognition.start(); }
            catch (e) { voiceStatus.textContent = 'Click to retry...'; }
        } else {
            voiceStatus.textContent = 'Voice not supported in this browser.';
            voiceTranscript.textContent = 'Please use Chrome or Edge for voice features.';
        }
    });

    closeVoice.addEventListener('click', () => {
        voiceModal.classList.add('hidden');
        if (recognition) try { recognition.stop(); } catch (e) { }
        window.speechSynthesis.cancel();
    });


    /* ===================================================
       7. CONTACT FORM — ONE-CLICK AUTOMATIC SEND
    =================================================== */
    // ⚡ INSTRUCTIONS: Go to https://formspree.io/ and get your unique ID
    const FORM_ENDPOINT = "https://formspree.io/f/YOUR_ID_HERE"; // Replace with your Formspree ID
    const submitBtn = document.getElementById('btn-submit-v9');
    const successBox = document.getElementById('contact-success');

    function getFormData() {
        return {
            name: document.getElementById('contact-name')?.value?.trim() || '',
            email: document.getElementById('contact-email')?.value?.trim() || '',
            farm: document.getElementById('contact-farm')?.value?.trim() || '',
            phone: document.getElementById('contact-phone')?.value?.trim() || '',
            message: document.getElementById('contact-msg')?.value?.trim() || '',
            _subject: `BHUMIIQ Farm Request from ${document.getElementById('contact-name')?.value?.trim() || 'New User'}`
        };
    }

    function validateForm(d) {
        if (!d.name) { alert('Please enter your name.'); return false; }
        if (!d.email) { alert('Please enter your email.'); return false; }
        if (!d.message) { alert('Please enter your message.'); return false; }
        return true;
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const data = getFormData();
            if (!validateForm(data)) return;

            // 1. Visual Feedback
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined loader-spin">sync</span> DISPATCHING INTELLIGENCE...';

            try {
                // 2. Background Send (Fetch)
                const response = await fetch(FORM_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    // 3. Success State
                    submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> DISPATCHED SUCCESS';
                    submitBtn.style.background = "var(--brand-emerald)";
                    successBox.classList.remove('hidden');
                    successBox.scrollIntoView({ behavior: 'smooth' });
                    
                    // Clear form
                    document.querySelectorAll('.form-grid-v9 input, .form-grid-v9 textarea').forEach(el => el.value = '');
                } else {
                    throw new Error();
                }
            } catch (err) {
                alert("Dispatch Failed. Please verify YOUR_ID_HERE in script.js (Formspree).");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

});
