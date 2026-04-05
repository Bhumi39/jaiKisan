const GEMINI_API_URL = '/api/gemini';

document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       1. NAVIGATION & BACK NAVIGATION
       ============================== */
    const screens = document.querySelectorAll('.screen');
    const navLinks = document.querySelectorAll('.desktop-nav a, .nav-brand, .f-panel, .mini-card, .btn');
    const backBtn = document.getElementById('back-home-btn');

    function navigateTo(targetId) {
        if (!targetId) return;
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) targetScreen.classList.add('active');

        // Toggle Back Button
        if (targetId === 'screen-home') backBtn.classList.add('hidden');
        else backBtn.classList.remove('hidden');

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
    navigateTo('screen-home');


    /* ===============================
       2. CINEMATIC LOADER
       ============================== */
    const loader = document.getElementById('cinematic-loader');
    function showLoader(txt) { loader.querySelector('.loader-text').innerText = txt; loader.classList.remove('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }


    /* ===============================
       3. 🎙️ LIVE VOICE ASSISTANT (Speech-to-Text)
       ============================== */
    const voiceTrigger = document.getElementById('voice-trigger-v6');
    const voiceModal = document.getElementById('voice-overlay');
    const voiceStatus = document.getElementById('voice-status');
    const voiceText = document.getElementById('voice-transcript');
    const closeVoice = document.getElementById('close-voice');

    let recognition;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'hi-IN'; // Default to Hindi-In

        recognition.onstart = () => {
             voiceStatus.innerText = "Listening...";
             voiceText.innerText = "Please ask your farming question...";
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            voiceText.innerText = `Recognized: "${transcript}"`;
            voiceStatus.innerText = "Thinking...";
            
            // Send to Gemini
            try {
                const payload = { contents: [{ parts: [{ text: `User asked by voice: ${transcript}. Provide a short bilingual reply (English & Hindi).` }] }], type: 'text' };
                const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const data = await res.json();
                const reply = data.candidates[0].content.parts[0].text;
                
                voiceStatus.innerText = "BHUMIIQ Speaking...";
                voiceText.innerText = reply;
                speakBilingual(reply);
            } catch (e) { voiceStatus.innerText = "Error in Voice IQ."; }
        };

        recognition.onerror = () => {  voiceModal.classList.add('hidden'); };
        recognition.onend = () => { voiceStatus.innerText = "Processing Complete."; };
    }

    voiceTrigger.addEventListener('click', () => {
        voiceModal.classList.remove('hidden');
        if (recognition) recognition.start();
        else alert("Speech Recognition not supported in this browser.");
    });

    closeVoice.addEventListener('click', () => {
        voiceModal.classList.add('hidden');
        if (recognition) recognition.stop();
        window.speechSynthesis.cancel();
    });

    function speakBilingual(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN';
            window.speechSynthesis.speak(utterance);
        }
    }


    /* ===============================
       4. 🩺 BILINGUAL DOCTOR IQ (Advanced Roadmap)
       ============================== */
    const uploadArea = document.getElementById('upload-clickable');
    const analyzeBtn = document.getElementById('btn-analyze-v6');
    const resultsArea = document.getElementById('doctor-results-v6');
    const camIn = document.getElementById('doctor-camera');
    const galIn = document.getElementById('doctor-gallery');
    const previewImg = document.getElementById('leaf-image-v6');
    const promptTag = document.getElementById('upload-prompt');

    let base64 = null;
    let type = null;

    uploadArea.addEventListener('click', () => galIn.click());

    function handleImg(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            promptTag.classList.add('hidden');
            previewImg.classList.remove('hidden-img-v6');
            previewImg.src = evt.target.result;
            base64 = evt.target.result.split(',')[1];
            type = file.type;
        }
        reader.readAsDataURL(file);
    }
    camIn.addEventListener('change', handleImg);
    galIn.addEventListener('change', handleImg);

    analyzeBtn.addEventListener('click', async () => {
        if (!base64) return;
        showLoader("Generating Bilingual Roadmap...");

        const prompt = `You are BHUMIIQ Global Expert. Analyze this plant photo:
        1. MANDATORY: FOR EVERY SENTENCE, PROVIDE ENGLISH THEN HINDI TRANSLATION.
        2. Diagnosis of the issue.
        3. HEALTH SCORE (0-100%).
        4. BILINGUAL Dos & Don'ts.
        5. FERTILIZER IQ LIBRARY: Provide exactly 10 suggested treatments/cures (Chemical & Organic choices). Explain exactly how to apply each.
        Format this as a professional roadmap.`;

        try {
            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: type, data: base64 } }
                    ]
                }],
                type: 'vision'
            };
            const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            const reply = data.candidates[0].content.parts[0].text;

            const chanceMatch = reply.match(/(\d+)%/);
            const chance = chanceMatch ? chanceMatch[1] : 75;

            resultsArea.innerHTML = `
                <div class="roadmap-container mt-40">
                    <div class="roadmap-card">
                         <h3>Health IQ: ${chance}% Survival Probability</h3>
                         <div class="survival-chance-bar"><div class="survival-progress" style="width:${chance}%"></div></div>
                    </div>
                    
                    <div class="roadmap-card">
                        <h4 class="mb-20">Diagnostic Roadmap (Bilingual)</h4>
                        <div class="roadmap-step">
                            ${reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<span class="hi-text-result">$1</span>')}
                        </div>
                    </div>

                    <div class="roadmap-card">
                        <h4 class="mb-20">Fertilizer IQ Library (10+ Options)</h4>
                        <div class="fertilizer-library">
                            <!-- In a real app we'd parse the 10 items into cards -->
                            ${reply.includes('Fertilizer') ? '<div class="f-cure-item"><h5>Scientific Treatments Found</h5><p>See expert roadmap below for the full 10-item library.</p></div>' : ''}
                        </div>
                    </div>
                </div>
            `;
        } catch (e) { alert("Error in Scan IQ."); }
        finally { hideLoader(); }
    });


    /* ===============================
       5. ⛈️ SOWING IQ & OTHERS
       ============================== */
    const getSowingBtn = document.getElementById('btn-get-sowing-v6');
    const sowingResult = document.getElementById('sowing-results-v6');
    
    getSowingBtn.addEventListener('click', async () => {
        showLoader("Calculating Sowing Intelligence...");
        try {
           const prompt = `Based on current weather, recommend exactly 3 crops for high yield. Provide bilingual English/Hindi output.`;
           const payload = { contents: [{ parts: [{ text: prompt }] }], type: 'text' };
           const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
           const data = await res.json();
           sowingResult.innerHTML = `<div class="roadmap-card">${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</div>`;
        } catch(e) {} finally { hideLoader(); }
    });

});
