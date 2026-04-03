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

    function navigateTo(targetId, title, themeColor = "#FFB74D") {
        screens.forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) targetScreen.classList.add('active');

        if (targetId === 'screen-home') {
            appBar.classList.add('hidden');
            appBox.style.backgroundColor = '#FDFBF7';
        } else {
            appBar.classList.remove('hidden');
            screenTitle.innerText = title;
            appBar.style.backgroundColor = themeColor;
            appBox.style.backgroundColor = '#FDFBF7';
        }

        if (targetId === 'screen-weather') fetchWeather();
    }

    navigateTo('screen-home', 'Home');

    navCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-target');
            const title = card.getAttribute('data-title');

            card.classList.remove('active');
            void card.offsetWidth;
            card.classList.add('active');

            setTimeout(() => navigateTo(target, title), 200);
        });
    });

    backBtn.addEventListener('click', () => {
        navigateTo('screen-home', 'Home');
        if (recognition && isListening) recognition.stop();
        window.speechSynthesis.cancel();
    });


    /* ===============================
       2. WEATHER API (Open-Meteo + NOMINATIM)
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
                    // Fetch temperature
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                    const data = await res.json();

                    const temp = data.current_weather.temperature;
                    const code = data.current_weather.weathercode;
                    wTemp.innerText = `${temp}°C`;

                    // Basic conditions mapping
                    if (code <= 3) { wDesc.innerText = "Clear / Partially Cloudy"; wIcon.innerText = "partly_cloudy_day"; }
                    else if (code <= 48) { wDesc.innerText = "Foggy"; wIcon.innerText = "foggy"; }
                    else if (code <= 69) { wDesc.innerText = "Rainy (बारिश)"; wIcon.innerText = "rainy"; }
                    else { wDesc.innerText = "Stormy / Snow"; wIcon.innerText = "thunderstorm"; }

                    // REVERSE GEOCODING to get the City/Village name!
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const geoData = await geoRes.json();
                    let placeName = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || geoData.address.state;
                    wLoc.innerText = `Location: ${placeName} (${geoData.address.country})`;

                    weatherLoading.classList.add('hidden');
                    weatherResult.classList.remove('hidden');

                } catch (e) {
                    wDesc.innerText = "Failed to load weather.";
                    wLoc.innerText = "Check your connection.";
                    weatherLoading.classList.add('hidden');
                    weatherResult.classList.remove('hidden');
                }

            }, () => {
                wDesc.innerText = "Location permission denied.";
                wLoc.innerText = "Please allow GPS to see local weather.";
                weatherLoading.classList.add('hidden');
                weatherResult.classList.remove('hidden');
            });
        } else {
            wDesc.innerText = "Geolocation not supported.";
            weatherLoading.classList.add('hidden');
            weatherResult.classList.remove('hidden');
        }
    }

    /* ===============================
       3. PHOTO EXPERT (Gemini Vision)
       =============================== */
    const btnCamera = document.getElementById('btn-camera');
    const btnGallery = document.getElementById('btn-gallery');
    const cameraInput = document.getElementById('camera-input');
    const galleryInput = document.getElementById('gallery-input');
    const leafImage = document.getElementById('leaf-image');
    const imgPlaceholderIcon = document.getElementById('img-placeholder-icon');
    const imgPlaceholderText = document.getElementById('img-placeholder-text');
    const btnAnalyze = document.getElementById('btn-analyze');
    const aiPhotoResult = document.getElementById('ai-photo-result');
    const aiPhotoText = aiPhotoResult.querySelector('p');

    let base64ImageString = null;
    let imageMimeType = null;

    btnCamera.addEventListener('click', () => cameraInput.click());
    btnGallery.addEventListener('click', () => galleryInput.click());

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            imgPlaceholderIcon.style.display = 'none';
            imgPlaceholderText.style.display = 'none';
            leafImage.style.display = 'block';
            leafImage.src = evt.target.result;

            // Extract pure base64 for Gemini (remove data:image/jpeg;base64,)
            const resultStr = evt.target.result;
            base64ImageString = resultStr.split(',')[1];
            imageMimeType = file.type;

            aiPhotoResult.classList.add('hidden');
        }
        reader.readAsDataURL(file);
    }

    cameraInput.addEventListener('change', handleImageUpload);
    galleryInput.addEventListener('change', handleImageUpload);

    btnAnalyze.addEventListener('click', async () => {
        if (!base64ImageString) {
            alert('Please capture or upload an image first!');
            return;
        }

        const quotes = [
            "Healthy soil, healthy life. (स्वस्थ मिट्टी, स्वस्थ जीवन।)",
            "The farmer is the only man in our economy who buys everything at retail, sells everything at wholesale. (किसान ही हमारी अर्थव्यवस्था का वह व्यक्ति है जो सब कुछ फुटकर में खरीदता है और थोक में बेचता है।)",
            "Agriculture is the most healthful, most useful and most noble employment of man. (कृषि मनुष्य का सबसे स्वस्थ, सबसे उपयोगी और सबसे महान कार्य है।)",
            "Farming is a profession of hope. (खेती आशा का व्यवसाय है।)",
            "A farmer is a magician who produces money from the mud. (किसान वह जादूगर है जो कीचड़ से पैसा पैदा करता है।)"
        ];
        let quoteIndex = 0;

        aiPhotoResult.classList.remove('hidden');
        aiPhotoResult.style.backgroundColor = '#F5F7FA';

        const updateLoadingQuote = () => {
            aiPhotoText.innerHTML = `
                <div class="text-center">
                    <span class="material-symbols-outlined pulse-animation" style="font-size:32px; color:var(--md-sys-color-primary);">psychology</span>
                    <p style="font-style:italic; color:#555; margin-top:8px;">"${quotes[quoteIndex]}"</p>
                    <p style="font-size:12px; color:#888;">Analyzing your crop... (आपकी फसल का विश्लेषण कर रहे हैं...)</p>
                </div>
            `;
            quoteIndex = (quoteIndex + 1) % quotes.length;
        };

        updateLoadingQuote();
        const quoteInterval = setInterval(updateLoadingQuote, 3000);

        try {
            const payload = {
                contents: [{
                    parts: [
                        { text: "You are an expert agricultural botanist named Jai Kisan. FIRST, deeply analyze the image. If the photo does NOT clearly contain a plant, leaf, crop, or agricultural vegetable, OR if the photo is entirely blurred/unreadable, you must stop and reply EXACTLY with: 'यह छवि किसी पौधे/फसल की नहीं है, या बहुत धुंधली है। कृपया पौधे की साफ फोटो अपलोड करें।\n\n(This image is not related to a plant or is too blurry. Please upload a clear photo.)' Do not add anything else. IF the photo IS a valid plant, identify any diseases and suggest a short remedy. Return your answer cleanly formatted with English and Hindi bullet points." },
                        {
                            inlineData: {
                                mimeType: imageMimeType,
                                data: base64ImageString
                            }
                        }
                    ]
                }],
                type: 'vision'
            };

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errDetails = await response.json();
                console.error("Gemini Error Details:", errDetails);
                throw new Error(errDetails.error?.message || response.statusText);
            }

            const data = await response.json();
            const replyText = data.candidates[0].content.parts[0].text;
            clearInterval(quoteInterval);

            aiPhotoResult.style.backgroundColor = '#E8F5E9'; // success green tint
            aiPhotoText.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <strong>Expert Diagnosis:</strong>
                    <button class="btn btn-tertiary" id="btn-listen-photo" style="padding:4px 12px; font-size:12px; display:flex; align-items:center; gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:18px;">volume_up</span> Listen
                    </button>
                </div>
                <div id="photo-reply-content">${replyText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
            `;

            document.getElementById('btn-listen-photo').addEventListener('click', () => {
                speakText(replyText);
            });

        } catch (error) {
            clearInterval(quoteInterval);
            aiPhotoResult.style.backgroundColor = '#FFEBEE';
            aiPhotoText.innerHTML = `<strong>Error analyzed:</strong><br><br>${error.message}<br><br><small>If payload is too large, try uploading a smaller image.</small>`;
            console.error(error);
        }
    });

    /* ===============================
       4. MANDI PRICES (Gemini AI Powered)
       =============================== */
    const mandiPreviewBtn = document.getElementById('mandi-search-btn');
    const mandiResults = document.getElementById('mandi-results');

    mandiPreviewBtn.addEventListener('click', async () => {
        const state = document.getElementById('mandi-state').value;
        const comm = document.getElementById('mandi-comm').value;
        const fromDate = document.getElementById('mandi-from-date').value;
        const toDate = document.getElementById('mandi-to-date').value;

        if (!state || !comm) {
            alert("Please select both State and Commodity.");
            return;
        }

        mandiResults.innerHTML = `
            <div class="text-center">
                <span class="material-symbols-outlined pulse-animation" style="font-size: 40px; color: var(--md-sys-color-primary);">analytics</span>
                <p>AI is analyzing market trends...<br><span class="hindi-text">AI बाजार के रुझानों का विश्लेषण कर रहा है...</span></p>
            </div>
        `;

        try {
            const prompt = `You are an expert Jai Kisan Market Analyst. Provide detailed market price information, trends, and advice for ${comm} in ${state} ${fromDate && toDate ? `between ${fromDate} and ${toDate}` : 'currently'}. 
            Format the response for a farmer. Use bullet points. 
            Provide the answer in both English and clear Hindi. 
            Include:
            - Estimated Price Range (₹ per Quintal)
            - Market Trend (Rising/Stable/Falling)
            - Quick Advice for the farmer.`;

            const payload = {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                type: 'text'
            };

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("AI Market Service unavailable");

            const data = await response.json();
            const replyText = data.candidates[0].content.parts[0].text;

            mandiResults.innerHTML = `
                <div style="background:white; padding:20px; border-radius:16px; text-align:left; border-left: 6px solid var(--md-sys-color-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <h3 style="margin-bottom:12px; color:var(--md-sys-color-primary); display:flex; align-items:center; gap:8px;">
                        <span class="material-symbols-outlined">trending_up</span>
                        Market Report
                    </h3>
                    <div style="font-size:14px; line-height:1.6; color:#333;">
                        ${replyText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                    </div>
                    <p style="font-size:10px; color:#999; margin-top:16px; text-align:right;">Powered by Gemini AI</p>
                </div>
            `;

        } catch (error) {
            mandiResults.innerHTML = `<p style="color: #D32F2F;">Failed to fetch AI market report. Please try again later.</p>`;
            console.error(error);
        }
    });

    const mandiResetBtn = document.getElementById('mandi-reset-btn');
    mandiResetBtn.addEventListener('click', () => {
        document.getElementById('mandi-state').value = "";
        document.getElementById('mandi-comm').value = "";
        document.getElementById('mandi-from-date').value = "";
        document.getElementById('mandi-to-date').value = "";
        mandiResults.innerHTML = `<p style="color: #666; font-size: 14px;">Prices will be shown here / यहाँ कीमतें दिखाई जाएँगी।</p>`;
    });

    /* ===============================
       5. VOICE ASSISTANT
       =============================== */
    const voiceBtn = document.getElementById('voice-btn');
    const chatContainer = document.getElementById('chat-container');

    let recognition = null;
    let isListening = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'hi-IN';

        recognition.onstart = () => {
            isListening = true;
            voiceBtn.classList.add('pulse-animation');
            appendChat('User', 'Listening... / सुन रहा है...');
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            voiceBtn.classList.remove('pulse-animation');
            chatContainer.removeChild(chatContainer.lastChild); // remove listening bubble
            appendChat('User', transcript);
            await askVoiceGemini(transcript);
        };

        recognition.onerror = () => {
            voiceBtn.classList.remove('pulse-animation');
            isListening = false;
        };

        recognition.onend = () => {
            isListening = false;
            voiceBtn.classList.remove('pulse-animation');
        };
    }

    voiceBtn.addEventListener('click', () => {
        if (recognition) {
            if (!isListening) recognition.start();
        } else {
            alert('Speech Recognition not supported in this browser.');
        }
    });

    function appendChat(sender, text) {
        const div = document.createElement('div');
        div.className = sender === 'User' ? 'chat-bubble chat-user' : 'chat-bubble';

        let innerHtml = sender === 'Bot'
            ? `<p class="hindi-text">${text} <span class="material-symbols-outlined chat-icon" style="color:#F57C00;">volume_up</span></p>`
            : `<p>${text}</p>`;

        div.innerHTML = innerHtml;
        chatContainer.appendChild(div);
        document.getElementById('screen-voice').scrollTop = document.getElementById('screen-voice').scrollHeight;
    }

    async function askVoiceGemini(query) {
        try {
            const payload = {
                contents: [{
                    parts: [{ text: `You are an AI assistant for Indian farmers named Jai Kisan. Answer briefly (1 sentence) in clear Hindi: ${query}` }]
                }],
                type: 'text'
            };

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            let replyText = data.candidates[0].content.parts[0].text;

            appendChat('Bot', replyText);
            speakText(replyText);

        } catch (error) {
            appendChat('Bot', 'मुझे समझ नहीं आया। क्रिपया पुनः प्रयास करें। (Could not reach API)');
        }
    }

    function speakText(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const hiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.includes('hi'));
            if (hiVoice) {
                utterance.voice = hiVoice;
                utterance.lang = 'hi-IN';
            }
            window.speechSynthesis.speak(utterance);
        }
    }
});
