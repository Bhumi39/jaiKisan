// BHUMIIQ CORE ENGINE - V2.1.1 - 2026-04-07
window.BHUMIIQ_VERSION = "2.1.1";
console.log("BHUMIIQ V2.1.1 Loaded Successfully");
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
        
        // Contextual triggers when entering screens
        if (id === 'screen-mandi') loadMandiPrices();
        
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
            document.getElementById('btn-report-v9').classList.remove('hidden');
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
        const survivalMatch = raw.match(/SURVIVAL CHANCE[:\s]*\[?(\d+)\]?%/i);
        const chance = survivalMatch ? parseInt(survivalMatch[1]) : 75;
        const chanceColor = chance >= 70 ? '#10B981' : chance >= 40 ? '#F59E0B' : '#EF4444';

        const diseaseMatch = raw.match(/DISEASE NAME[:\s]*(.+)/i);
        const diseaseName = diseaseMatch ? diseaseMatch[1].trim() : 'Crop Health Analysis';

        const hindiDiseaseMatch = raw.match(/रोग का नाम[:\s]*(.+)/i);
        const hindiDisease = hindiDiseaseMatch ? hindiDiseaseMatch[1].trim() : '';

        const dosMatch = raw.match(/DO'S[^:]*:([\s\S]*?)(?:DON'TS|$)/i);
        const dosItems = (dosMatch ? dosMatch[1].trim() : '').split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim()).slice(0, 4);

        const dontsMatch = raw.match(/DON'TS[^:]*:([\s\S]*?)(?:FERTILIZER|$)/i);
        const dontsItems = (dontsMatch ? dontsMatch[1].trim() : '').split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim()).slice(0, 4);

        const fertMatch = raw.match(/FERTILIZER[^:]*PORTFOLIO[^:]*:([\s\S]*?)(?:\n\n\n|$)/i);
        const fertLines = (fertMatch ? fertMatch[1] : raw).split('\n').filter(l => /^\d+\./.test(l.trim())).slice(0, 10);

        resultsBox.innerHTML = `
      <div class="health-cert">
        <div class="cert-top">
          <div>
            <div style="font-size:12px;opacity:0.6;letter-spacing:1px;margin-bottom:4px;">BHUMIIQ INTELLIGENCE REPORT</div>
            <h3>${diseaseName}</h3>
            <div style="color:#6EE7B7;font-size:15px;margin-top:4px;">${hindiDisease}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;opacity:0.6;letter-spacing:1px;margin-bottom:4px;">SURVIVAL CHANCE</div>
            <div class="score-badge" style="color:${chanceColor};">${chance}%</div>
          </div>
        </div>

        <div class="health-bar-wrap">
          <div class="health-bar-track"><div class="health-bar-fill" id="bar-fill" style="width:0%"></div></div>
        </div>

        <div class="cert-body">
          <!-- 🧬 INTELLIGENCE FLOWCHART -->
          <div class="flowchart-container">
            <div class="flow-node">Image Analysis</div>
            <div class="flow-arrow"></div>
            <div class="flow-node">Pathogen DNA Matching</div>
            <div class="flow-arrow"></div>
            <div class="flow-node" style="border-color:var(--gold);">${diseaseName} Identified</div>
          </div>

          <!-- 📝 POINT-TO-POINT BULLET-IQ -->
          <div class="point-card">
            ${dosItems.map(d => `
                <div class="point-item">
                    <div class="point-icon"><span class="material-symbols-outlined">check_circle</span></div>
                    <div class="point-text"><strong>Action Required</strong>${d}</div>
                </div>
            `).join('')}
            ${dontsItems.map(d => `
                <div class="point-item" style="border-color:#FECDD3;">
                    <div class="point-icon" style="background:#FFF1F2; color:#EF4444;"><span class="material-symbols-outlined">cancel</span></div>
                    <div class="point-text"><strong style="color:#EF4444;">Warning</strong>${d}</div>
                </div>
            `).join('')}
          </div>

          <div style="margin-top:32px;">
            <h4 style="font-size:18px;font-weight:900;color:#012A1A;margin-bottom:16px;">💊 Recommended Treatment</h4>
            <div class="fert-grid">
              ${fertLines.map(f => {
                const parts = f.split('.');
                const content = parts.slice(1).join('.').split('-');
                return `<div class="fert-item"><h5>${content[0]?.trim() || f}</h5><p>${content[1]?.trim() || 'Apply as directed'}</p></div>`;
              }).join('')}
            </div>
          </div>

          <div style="margin-top:32px;padding:32px;background:#F9FAFB;border-radius:20px;">
            <h4 style="font-size:16px;font-weight:900;color:#012A1A;margin-bottom:16px;">Full Roadmap Discovery</h4>
            <div style="font-size:14px;line-height:1.9;color:#374151;">
              ${raw.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#012A1A;">$1</strong>')}
            </div>
          </div>
        </div>
      </div>`;

        setTimeout(() => {
            const bar = document.getElementById('bar-fill');
            if (bar) bar.style.width = chance + '%';
        }, 200);
    }

    // PDF Report Generator (Mock)
    document.getElementById('btn-report-v9').addEventListener('click', () => {
        alert("Generating High-Resolution PDF Report...\nEncrypted report will be sent to your registered email and WhatsApp.");
    });


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
                
                // 📍 REVERSE GEOCODING
                try {
                    const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                    const geoData = await geoRes.json();
                    const locationName = geoData.city || geoData.locality || "Region India";
                    weatherBox.innerHTML = `<div class="location-tag reveal-up active"><span class="material-symbols-outlined">location_on</span> ${locationName}</div>` + weatherBox.innerHTML;
                } catch(ge) { console.log('Location name fetch failed'); }

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
            const prompt = `You are BHUMIIQ Sowing Advisor. Based on this weather: ${currentWeatherContext || 'current season conditions in India'}, recommend exactly 3 crops. For each crop provide: Crop Name (English + Hindi), Why suitable, and Risk Factors. Format: [CROP_NAME]: [DETAILS].`;

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'text', contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await res.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No results.';
            
            // 🃏 RENDER IN BULLET-IQ
            const lines = reply.split('\n').filter(l => l.includes(':'));
            sowingResults.innerHTML = `
                <div class="point-card">
                    ${lines.map(line => {
                        const [title, desc] = line.split(':');
                        return `
                        <div class="point-item">
                            <div class="point-icon"><span class="material-symbols-outlined">eco</span></div>
                            <div class="point-text"><strong>${title.replace(/^-\s*/, '').trim()}</strong>${desc?.trim() || ''}</div>
                        </div>`;
                    }).join('')}
                </div>`;
            sowingResults.scrollIntoView({ behavior: 'smooth' });

        } catch (e) {
            sowingResults.innerHTML = `<div style="padding:24px;background:#FFF1F2;border-radius:16px;color:#9F1239;font-weight:700;">Intelligence error.</div>`;
        } finally {
            hideLoader();
        }
    });

    // 🌤️ Weather Q&A Logic
    const weatherQAQuery = document.getElementById('weather-qa-query');
    const weatherQABtn = document.getElementById('btn-weather-qa');
    const weatherQAResult = document.getElementById('weather-qa-result');

    weatherQABtn.addEventListener('click', async () => {
        const q = weatherQAQuery.value.trim();
        if (!q) return;
        
        weatherQAResult.classList.remove('hidden');
        weatherQAResult.textContent = 'Thinking...';
        
        try {
            const prompt = `You are BHUMIIQ Weather Assistant. Based on current weather: ${currentWeatherContext}, answer the farmer's question: "${q}". Provide point-to-point actionable advice.`;
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'text', contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await res.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
            weatherQAResult.innerHTML = reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } catch (e) { weatherQAResult.textContent = 'Intelligence Error.'; }
    });


    /* ===================================================
       6. PRECISION MANDI PRICE DISCOVERY
    =================================================== */
    async function loadMandiPrices() {
        const mandiBox = document.getElementById('mandi-results-v9');
        const searchBtn = document.getElementById('btn-search-mandi');

        searchBtn.onclick = async () => {
            const state = document.getElementById('mandi-state').value;
            const district = document.getElementById('mandi-district').value;
            const date = document.getElementById('mandi-date').value;
            const crop = document.getElementById('mandi-crop-type').value;

            if (!state || !district || !crop) {
                alert("Please specify State, District and Crop Type.");
                return;
            }

            mandiBox.innerHTML = `
                <div class="point-item shimmer" style="height:60px; margin-bottom:12px;"></div>
                <div class="point-item shimmer" style="height:60px;"></div>
            `;

            try {
                const prompt = `You are BHUMIIQ Market Discovery. Provide current estimated Mandi prices for: 
                State=${state}, District=${district}, Date=${date || 'Today'}, Crop=${crop}. 
                Provide 4-5 precision points: [POINT_NAME]: [Price/Trend Detail]. Reply in English twice (high-precision professional language).`;
                
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'text', contents: [{ parts: [{ text: prompt }] }] })
                });
                const data = await res.json();
                const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No data.';
                
                const lines = raw.split('\n').filter(l => l.includes(':'));
                mandiBox.innerHTML = `
                    <div class="point-card">
                        ${lines.map(line => {
                            const [title, desc] = line.split(':');
                            const trend = desc.toLowerCase().includes('up') ? 'trending_up' : 'trending_down';
                            return `
                            <div class="point-item">
                                <div class="point-icon"><span class="material-symbols-outlined">${trend}</span></div>
                                <div class="point-text"><strong>${title.replace(/^-\s*/, '').trim()}</strong>${desc?.trim() || ''}</div>
                            </div>`;
                        }).join('')}
                    </div>`;
            } catch (e) { mandiBox.innerHTML = '<p>Market feed unavailable. Try again later.</p>'; }
        };
    }


    /* ===================================================
       7. FARM PRO TOOLBOX (EXPANDED DUAL-INPUTS)
    =================================================== */
    window.openTool = (tool) => {
        const activeBox = document.getElementById('toolbox-active-tool');
        activeBox.classList.remove('hidden');
        
        let html = '';
        if (tool === 'irrigation') {
            html = `
                <div class="mandi-card" style="max-width:700px; margin:0 auto;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>💧 Irrigation Planner IQ</h3>
                        <span class="material-symbols-outlined" style="opacity:0.3; cursor:pointer;" onclick="this.closest('.hidden').classList.add('hidden')">close</span>
                    </div>
                    <div class="form-grid-v9 mt-24">
                        <div class="input-pair"><label>Crop Type</label><input type="text" id="tool-crop" placeholder="e.g., Rice"></div>
                        <div class="input-pair"><label>Acreage</label><input type="number" id="tool-acres" placeholder="10"></div>
                        <div class="input-pair"><label>Soil Type</label><input type="text" id="tool-soil" placeholder="Clay/Sandy"></div>
                        <div class="input-pair"><label>Crop Age (Days)</label><input type="number" id="tool-age" placeholder="30"></div>
                    </div>
                    <button class="btn btn-primary btn-pill full-btn mt-24" onclick="calcTool('irrigation')">Optimize Water Schedule</button>
                    <div id="tool-result" class="mt-24 hidden"></div>
                </div>`;
        } else if (tool === 'yield') {
            html = `
                <div class="mandi-card" style="max-width:700px; margin:0 auto;">
                    <h3>📊 Deep Yield Predictor</h3>
                    <div class="form-grid-v9 mt-24">
                        <div class="input-pair"><label>Crop Variety</label><input type="text" id="tool-variety" placeholder="e.g., Basmati"></div>
                        <div class="input-pair"><label>Fertilizer Strategy</label><input type="text" id="tool-fertilizer" placeholder="DAP/Urea"></div>
                        <div class="input-pair"><label>Last Season Yield</label><input type="number" id="tool-last" placeholder="2000kg"></div>
                        <div class="input-pair"><label>Sowing Date</label><input type="date" id="tool-sowing"></div>
                    </div>
                    <button class="btn btn-primary btn-pill full-btn mt-24" onclick="calcTool('yield')">Generate Probability Report</button>
                    <div id="tool-result" class="mt-24 hidden"></div>
                </div>`;
        } else if (tool === 'cost') {
            html = `
                <div class="mandi-card" style="max-width:700px; margin:0 auto;">
                    <h3>💰 Enterprise Cost Sheet</h3>
                    <div class="form-grid-v9 mt-24">
                        <div class="input-pair"><label>Labor Count</label><input type="number" id="tool-labor" placeholder="5"></div>
                        <div class="input-pair"><label>Seed Price/kg</label><input type="number" id="tool-seed-price" placeholder="40"></div>
                        <div class="input-pair"><label>Fuel/Machinery</label><input type="number" id="tool-fuel" placeholder="5000"></div>
                        <div class="input-pair"><label>Total Acres</label><input type="number" id="tool-total-acres" placeholder="5"></div>
                    </div>
                    <button class="btn btn-primary btn-pill full-btn mt-24" onclick="calcTool('cost')">Calculate Profit Margin</button>
                    <div id="tool-result" class="mt-24 hidden"></div>
                </div>`;
        } else if (tool === 'fert') {
            html = `
                <div class="mandi-card" style="max-width:700px; margin:0 auto;">
                    <h3>🧪 Precision Fertilizer IQ</h3>
                    <div class="form-grid-v9 mt-24">
                        <div class="input-pair"><label>Soil Nitrogen (N)</label><input type="text" id="tool-n" placeholder="High/Low"></div>
                        <div class="input-pair"><label>Phosphorus (P)</label><input type="text" id="tool-p" placeholder="High/Low"></div>
                        <div class="input-pair"><label>Potassium (K)</label><input type="text" id="tool-k" placeholder="High/Low"></div>
                        <div class="input-pair"><label>Preferred Source</label><input type="text" id="tool-source" placeholder="Organic/NPK"></div>
                    </div>
                    <button class="btn btn-primary btn-pill full-btn mt-24" onclick="calcTool('fert')">Get Precise Formula</button>
                    <div id="tool-result" class="mt-24 hidden"></div>
                </div>`;
        }
        activeBox.innerHTML = html;
        activeBox.scrollIntoView({ behavior: 'smooth' });
    };

    window.calcTool = async (type) => {
        const resBox = document.getElementById('tool-result');
        resBox.classList.remove('hidden');
        resBox.innerHTML = `
            <div class="point-item shimmer" style="height:60px; margin-bottom:12px;"></div>
            <div class="point-item shimmer" style="height:60px;"></div>
        `;
        
        let context = '';
        if (type === 'irrigation') {
            context = `CROP: ${document.getElementById('tool-crop').value}, ACERS: ${document.getElementById('tool-acres').value}, SOIL: ${document.getElementById('tool-soil').value}, AGE: ${document.getElementById('tool-age').value}`;
        } else if (type === 'yield') {
            context = `VARIETY: ${document.getElementById('tool-variety').value}, FERT: ${document.getElementById('tool-fertilizer').value}, LAST_YIELD: ${document.getElementById('tool-last').value}, SOWING: ${document.getElementById('tool-sowing').value}`;
        } else if (type === 'cost') {
            context = `LABOR: ${document.getElementById('tool-labor').value}, SEED_PRICE: ${document.getElementById('tool-seed-price').value}, FUEL: ${document.getElementById('tool-fuel').value}, ACERS: ${document.getElementById('tool-total-acres').value}`;
        } else if (type === 'fert') {
            context = `N: ${document.getElementById('tool-n').value}, P: ${document.getElementById('tool-p').value}, K: ${document.getElementById('tool-k').value}, SOURCE: ${document.getElementById('tool-source').value}`;
        }
        
        try {
            const prompt = `You are BHUMIIQ Precision Tool. Provide a structured Point-to-Point report for: Type=${type}. Details: ${context}. 
            Format the answer as 4-5 clearly defined bullet points using the structure: [POINT_NAME]: [detailed insight]. Reply in English twice (high-precision professional language).`;
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'text', contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await res.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No data.';
            
            // RENDER IN POINT-TO-POINT FORMAT
            const lines = reply.split('\n').filter(l => l.includes(':'));
            resBox.innerHTML = `
                <div class="point-card">
                    ${lines.map(line => {
                        const [title, desc] = line.split(':');
                        return `
                        <div class="point-item">
                            <div class="point-icon"><span class="material-symbols-outlined">auto_graph</span></div>
                            <div class="point-text"><strong>${title.replace(/^-\s*/, '').trim()}</strong>${desc?.trim() || ''}</div>
                        </div>`;
                    }).join('')}
                </div>`;
        } catch (e) { resBox.textContent = 'Calculation Error.'; }
    };


    /* ===================================================
       8. LIVE VOICE ASSISTANT (CONVERSATIONAL IQ)
    =================================================== */
    const voiceEngineStatus = document.getElementById('voice-engine-status');
    const voiceTrigger = document.getElementById('voice-trigger');
    const voiceModal = document.getElementById('voice-overlay');
    const voiceStatus = document.getElementById('voice-status');
    const chatHistoryBox = document.getElementById('voice-chat-history');
    const voiceActions = document.getElementById('voice-actions');
    const clearHistoryBtn = document.getElementById('clear-voice-history');
    const askAgainBtn = document.getElementById('ask-again-voice');
    const langChips = document.querySelectorAll('.lang-chip');
    const voiceWaves = document.querySelector('.voice-waves');

    let currentVoiceLang = 'hi-IN';
    let voiceChatHistory = [];
    let recognition = null;
    let synth = window.speechSynthesis;
    const SpeechReco = window.SpeechRecognition || window.webkitSpeechRecognition;

    const langNames = {
        'hi-IN': { en: 'Hindi', native: 'हिन्दी', prompt: 'You MUST reply in both Hindi and English. Format: NA: [Hindi Text] | EN: [English Text]' },
        'en-IN': { en: 'English', native: 'English', prompt: 'You MUST reply in English twice. Format: NA: [English Text] | EN: [English Text]' },
        'pa-IN': { en: 'Punjabi', native: 'पੰਜਾਬी', prompt: 'You MUST reply in both Punjabi and English. Format: NA: [Punjabi Text] | EN: [English Text]' },
        'mr-IN': { en: 'Marathi', native: 'मराठी', prompt: 'You MUST reply in both Marathi and English. Format: NA: [Marathi Text] | EN: [English Text]' },
        'bn-IN': { en: 'Bengali', native: 'বাংলা', prompt: 'You MUST reply in both Bengali and English. Format: NA: [Bengali Text] | EN: [English Text]' },
        'te-IN': { en: 'Telugu', native: 'తెలుగు', prompt: 'You MUST reply in both Telugu and English. Format: NA: [Telugu Text] | EN: [English Text]' },
        'ta-IN': { en: 'Tamil', native: 'தமிழ்', prompt: 'You MUST reply in both Tamil and English. Format: NA: [Tamil Text] | EN: [English Text]' },
        'kn-IN': { en: 'Kannada', native: 'ಕನ್ನಡ', prompt: 'You MUST reply in both Kannada and English. Format: NA: [Kannada Text] | EN: [English Text]' },
        'ml-IN': { en: 'Malayalam', native: 'മലയാളം', prompt: 'You MUST reply in both Malayalam and English. Format: NA: [Malayalam Text] | EN: [English Text]' }
    };

    function loadChatHistory() {
        const saved = localStorage.getItem('bhumiIqVoiceChat');
        if (saved) {
            voiceChatHistory = JSON.parse(saved);
            renderHistory();
        }
    }

    function saveChatHistory() {
        localStorage.setItem('bhumiIqVoiceChat', JSON.stringify(voiceChatHistory));
    }

    function addBubble(sender, content, langCode = 'hi-IN') {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}-bubble`;
        
        if (sender === 'farmer') {
            bubble.innerHTML = `<span class="bubble-meta">Farmer</span><span class="native-voice-text">"${content}"</span>`;
        } else {
            const parts = content.split('|');
            const native = (parts[0] || '').replace('NA:', '').trim() || 'Translation...';
            const english = (parts[1] || '').replace('EN:', '').trim() || 'Translation...';

            bubble.innerHTML = `
                <div class="bubble-meta">BHUMIIQ</div>
                <span class="native-voice-text">${native}</span>
                <span class="english-voice-text">${english}</span>
                <div style="display:flex; gap:8px; margin-top:12px;">
                    <button class="btn btn-outline btn-pill btn-small-listen" data-text="${native.replace(/"/g, '&quot;')}" data-lang="${langCode}">
                        <span class="material-symbols-outlined" style="font-size:12px;">volume_up</span> Hear
                    </button>
                    <button class="btn btn-outline btn-pill btn-small-listen" data-text="${english.replace(/"/g, '&quot;')}" data-lang="en-IN">
                        <span class="material-symbols-outlined" style="font-size:12px;">translate</span> English
                    </button>
                </div>
            `;
        }
        
        chatHistoryBox.appendChild(bubble);
        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
    }

    function renderHistory() {
        chatHistoryBox.innerHTML = '';
        voiceChatHistory.forEach(item => addBubble(item.sender, item.content, item.langCode));
    }

    window.playbackText = (text, lang) => {
        if (!synth) return;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.voice = getRegionalVoice(lang);
        u.onstart = () => voiceWaves.classList.add('speaking-pulse');
        u.onend = () => voiceWaves.classList.remove('speaking-pulse');
        synth.speak(u);
    };

    function updateVoiceEngineStatus() {
        if (!synth) return;
        const voices = synth.getVoices();
        const base = currentVoiceLang.split('-')[0];
        const hasVoice = voices.some(v => v.lang.startsWith(base));
        if (hasVoice) {
            voiceEngineStatus.innerHTML = `<span class="material-symbols-outlined" style="color:var(--brand-emerald); vertical-align:middle; font-size:14px;">check_circle</span> Voice Ready (${langNames[currentVoiceLang].native})`;
            voiceEngineStatus.style.color = 'var(--brand-emerald)';
        } else {
            voiceEngineStatus.innerHTML = `<span class="material-symbols-outlined" style="color:#ef4444; vertical-align:middle; font-size:14px;">error_outline</span> Voice Missing (Text Only)`;
            voiceEngineStatus.style.color = '#ef4444';
        }
    }

    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = updateVoiceEngineStatus;

    function getRegionalVoice(langCode) {
        const voices = synth.getVoices();
        const base = langCode.split('-')[0];
        let best = voices.find(v => v.lang.startsWith(base) && (v.name.includes('Google') || v.name.includes('Premium')));
        if (!best) best = voices.find(v => v.lang.startsWith(base));
        return best;
    }

    if (SpeechReco) {
        recognition = new SpeechReco();
        recognition.onstart = () => {
            voiceWaves.classList.add('speaking-pulse');
            voiceStatus.textContent = `🎙️ Listening (${langNames[currentVoiceLang].native})...`;
            voiceActions.classList.add('hidden');
        };

        recognition.onresult = async e => {
            const q = e.results[0][0].transcript;
            voiceStatus.textContent = '🧠 Thinking...';
            voiceWaves.classList.remove('speaking-pulse');
            
            voiceChatHistory.push({ sender: 'farmer', content: q, langCode: currentVoiceLang });
            addBubble('farmer', q);

            const historyContext = voiceChatHistory.slice(-4).map(h => `${h.sender}: ${h.content}`).join('\n');

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'text',
                        contents: [{ parts: [{ text: `You are BHUMIIQ assistant. Context:\n${historyContext}\n\nQuestion: "${q}". ${langNames[currentVoiceLang].prompt}.` }] }]
                    })
                });
                const data = await res.json();
                const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'NA: Error | EN: Error';

                voiceChatHistory.push({ sender: 'ai', content: reply, langCode: currentVoiceLang });
                addBubble('ai', reply, currentVoiceLang);
                saveChatHistory();

                voiceStatus.textContent = 'Ready';
                voiceActions.classList.remove('hidden');

                const nativeReply = reply.split('|')[0].replace('NA:', '').trim();
                window.playbackText(nativeReply, currentVoiceLang);
            } catch (err) { voiceStatus.textContent = 'Connection Error'; }
        };

        recognition.onerror = () => {  voiceStatus.textContent = 'Mic Error. Tap to Retry.'; voiceActions.classList.remove('hidden'); };
    }

    voiceTrigger.addEventListener('click', () => {
        const dummy = new SpeechSynthesisUtterance(''); synth.speak(dummy);
        voiceModal.classList.remove('hidden');
        loadChatHistory();
        updateVoiceEngineStatus();
        if (recognition) { recognition.lang = currentVoiceLang; try { recognition.start(); } catch(e) { recognition.stop(); setTimeout(() => recognition.start(), 200); } }
    });

    langChips.forEach(chip => {
        chip.addEventListener('click', () => {
            langChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentVoiceLang = chip.dataset.lang;
            updateVoiceEngineStatus();
            if (recognition) { try { recognition.stop(); } catch(e){} setTimeout(() => { recognition.lang = currentVoiceLang; recognition.start(); }, 400); }
            voiceStatus.textContent = `Switched to ${langNames[currentVoiceLang].native}`;
        });
    });

    clearHistoryBtn.addEventListener('click', () => {
        voiceChatHistory = [];
        localStorage.removeItem('bhumiIqVoiceChat');
        renderHistory();
        voiceStatus.textContent = 'History Cleared';
    });

    askAgainBtn.addEventListener('click', () => {
        if (recognition) { recognition.lang = currentVoiceLang; try { recognition.start(); } catch(e) { recognition.stop(); setTimeout(() => recognition.start(), 200); } }
    });

    chatHistoryBox.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-small-listen');
        if (!btn) return;
        window.playbackText(btn.dataset.text, btn.dataset.lang);
    });

    document.getElementById('close-voice').addEventListener('click', () => {
        voiceModal.classList.add('hidden');
        if (recognition) try { recognition.stop(); } catch (e) { }
        synth.cancel();
    });


    /* ===================================================
       7. CONTACT FORM — ONE-CLICK AUTOMATIC SEND
    =================================================== */
    const FORM_ENDPOINT = "https://formspree.io/f/meepvzwn"; // Live Formspree ID
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

            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined loader-spin">sync</span> DISPATCHING...';

            try {
                const response = await fetch(FORM_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> SENT';
                    submitBtn.style.background = "var(--brand-emerald)";
                    successBox.classList.remove('hidden');
                    successBox.scrollIntoView({ behavior: 'smooth' });
                    document.querySelectorAll('.form-grid-v9 input, .form-grid-v9 textarea').forEach(el => el.value = '');
                } else { throw new Error(); }
            } catch (err) {
                alert("Dispatch Failed. Please verify YOUR_ID_HERE in script.js (Formspree).");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

});
