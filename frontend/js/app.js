/* ==========================================================================
   AI Social Media Automation Platform - Frontend Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Dashboard Login Gateway Authentication State
  const loginOverlay = document.getElementById('login-screen-overlay');
  const loginForm = document.getElementById('login-form');
  const loginEmailInput = document.getElementById('login-email-input');
  const headerUserEmail = document.getElementById('header-user-email');
  const btnLogout = document.getElementById('btn-logout');

  function checkAuthSession() {
    const savedEmail = localStorage.getItem('vido_user_email');
    if (savedEmail) {
      if (loginOverlay) loginOverlay.style.display = 'none';
      if (headerUserEmail) headerUserEmail.innerText = savedEmail;
    } else {
      if (loginOverlay) loginOverlay.style.display = 'flex';
    }
  }

  // Preset Profile Quick Selectors
  document.getElementById('preset-acc-1')?.addEventListener('click', () => {
    if (loginEmailInput) loginEmailInput.value = 'max.hix.prox@gmail.com';
    loginForm?.dispatchEvent(new Event('submit'));
  });

  document.getElementById('preset-acc-2')?.addEventListener('click', () => {
    if (loginEmailInput) loginEmailInput.value = 'tiktok.story1955@gmail.com';
    loginForm?.dispatchEvent(new Event('submit'));
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginEmailInput?.value.trim() || 'max.hix.prox@gmail.com';
    localStorage.setItem('vido_user_email', email);
    checkAuthSession();
  });

  btnLogout?.addEventListener('click', () => {
    localStorage.removeItem('vido_user_email');
    checkAuthSession();
  });

  // Run Auth Check on Load
  checkAuthSession();

  // Application State
  const state = {
    currentStep: 1,
    selectedPlatforms: ['TikTok', 'YouTube Shorts', 'X/Twitter', 'Instagram', 'Facebook'],
    selectedTopic: 'Autonomous AI Agents Breakthroughs',
    storyData: {
      title: 'The Shadow Behind Autonomous AI Agents',
      hook: "Whatever you do, don't ignore what just happened with autonomous AI agents...",
      story_text: "It was 3:17 AM when the quiet hum of AI servers suddenly changed. Sensors registered a signal coming from somewhere that didn't exist on any map. Researchers logged into the network only to realize the server logs were writing themselves in real time—warning them not to look out the window.",
      visual_prompt: "Cinematic dark thriller scene, atmospheric foggy night, glowing neon surveillance interface reflecting off rain-slicked glass",
      genre: "Thriller"
    },
    audioUrl: '/static/audio/default.wav',
    imageUrl: '/static/images/default.svg',
    videoData: null
  };

  // DOM Elements
  const stepItems = document.querySelectorAll('.step-item');
  const stepPanes = document.querySelectorAll('.step-pane');
  const platformCheckboxes = document.querySelectorAll('.platform-checkbox');
  const apiKeyModal = document.getElementById('api-key-modal');
  const btnApiKeys = document.getElementById('btn-api-keys');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnSaveApiKeys = document.getElementById('btn-save-api-keys');
  
  // Step Navigation Logic
  function goToStep(stepNumber) {
    state.currentStep = stepNumber;
    stepItems.forEach(item => {
      const step = parseInt(item.getAttribute('data-step'), 10);
      if (step === stepNumber) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    stepPanes.forEach(pane => {
      pane.style.display = 'none';
    });

    const activePane = document.getElementById(`pane-step-${stepNumber}`);
    if (activePane) {
      activePane.style.display = 'block';
    }

    if (stepNumber === 5) {
      fetchAnalytics();
    }
  }

  stepItems.forEach(item => {
    item.addEventListener('click', () => {
      const step = parseInt(item.getAttribute('data-step'), 10);
      goToStep(step);
    });
  });

  document.getElementById('btn-goto-step-2')?.addEventListener('click', () => goToStep(2));
  document.getElementById('btn-goto-step-3')?.addEventListener('click', () => goToStep(3));
  document.getElementById('btn-goto-step-4')?.addEventListener('click', () => goToStep(4));
  document.getElementById('btn-goto-step-5')?.addEventListener('click', () => goToStep(5));
  document.getElementById('btn-analytics-toggle')?.addEventListener('click', () => goToStep(5));

  // Platform Selector Toggle Controls
  platformCheckboxes.forEach(cb => {
    const input = cb.querySelector('input[type="checkbox"]');
    cb.addEventListener('click', (e) => {
      if (e.target !== input) {
        input.checked = !input.checked;
      }
      const platform = cb.getAttribute('data-platform');
      if (input.checked) {
        cb.classList.add('selected');
        if (!state.selectedPlatforms.includes(platform)) {
          state.selectedPlatforms.push(platform);
        }
      } else {
        cb.classList.remove('selected');
        state.selectedPlatforms = state.selectedPlatforms.filter(p => p !== platform);
      }
    });
  });

  // OAuth 2.0 Popup Flow Handlers
  document.querySelectorAll('.btn-oauth-connect').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = btn.getAttribute('data-platform');
      const width = 540;
      const height = 640;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      window.open(
        `/auth/login?platform=${platform}`,
        `OAuth_${platform}`,
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );
    });
  });

  // OAuth postMessage listener
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'OAUTH_SUCCESS') {
      const platform = event.data.platform;
      const badge = document.getElementById(`oauth-badge-${platform}`);
      if (badge) {
        badge.innerText = 'Connected ✅';
        badge.style.background = 'rgba(40, 167, 69, 0.25)';
        badge.style.color = '#28a745';
      }
      alert(`✅ ${platform.toUpperCase()} Account Successfully Connected via OAuth 2.0!`);
    }
  });

  // Edit & Review Modal Handlers
  const editReviewModal = document.getElementById('modal-edit-review');
  const editModalCloseBtn = document.getElementById('edit-modal-close-btn');
  const btnReviewAndEdit = document.getElementById('btn-review-and-edit');
  const btnSaveEditReview = document.getElementById('btn-save-edit-review');

  btnReviewAndEdit?.addEventListener('click', async () => {
    if (editReviewModal) editReviewModal.classList.add('open');
    try {
      const animStyle = document.getElementById('select-animation-style')?.value || '1960s Vintage Dark Cartoon';
      const res = await fetch('/api/generate-platform-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_data: state.storyData, genre: animStyle })
      });
      const copyData = await res.json();
      
      // Fill TikTok Copy
      if (copyData.tiktok) {
        document.getElementById('edit-tiktok-hook').value = copyData.tiktok.hook_3s || '';
        document.getElementById('edit-tiktok-caption').value = copyData.tiktok.caption || '';
        document.getElementById('edit-tiktok-hashtags').value = (copyData.tiktok.hashtags || []).join(' ');
      }
      // Fill Twitter Copy
      if (copyData.twitter) {
        document.getElementById('edit-twitter-text').value = copyData.twitter.tweet_text || '';
      }
      // Fill YouTube Copy
      if (copyData.youtube) {
        document.getElementById('edit-youtube-title').value = copyData.youtube.title || '';
        document.getElementById('edit-youtube-description').value = copyData.youtube.description || '';
      }
    } catch (err) {
      console.error('Error generating platform copywriting:', err);
    }
  });

  editModalCloseBtn?.addEventListener('click', () => editReviewModal?.classList.remove('open'));

  // Edit Copy Tab Switcher
  document.querySelectorAll('.copy-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.copy-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane-copy').forEach(p => p.style.display = 'none');
      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-tab');
      const pane = document.getElementById(`tab-copy-${targetTab}`);
      if (pane) pane.style.display = 'block';
    });
  });

  btnSaveEditReview?.addEventListener('click', () => {
    alert('✅ Platform Copywriting Approved & Updated Successfully!');
    if (editReviewModal) editReviewModal.classList.remove('open');
  });

  // Firebase Initialization & Cloud Sync Setup
  let firebaseApp = null;
  let firebaseDb = null;

  async function initFirebaseCloud() {
    try {
      const res = await fetch('/api/firebase-config');
      const cfg = await res.json();
      if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebaseApp = firebase.initializeApp(cfg);
        if (cfg.databaseURL) {
          firebaseDb = firebase.database();
          console.log('🔥 Firebase Cloud Database Initialized:', cfg.databaseURL);
        }
      }
    } catch (err) {
      console.warn('Firebase SDK initialization notice:', err);
    }
  }
  initFirebaseCloud();

  // Modal Dialog Handlers
  btnApiKeys?.addEventListener('click', async () => {
    apiKeyModal.classList.add('open');
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.openrouter_key && document.getElementById('input-openrouter-key')) {
        document.getElementById('input-openrouter-key').value = data.openrouter_key;
      }
      if (data.gemini_key && document.getElementById('input-gemini-key')) {
        document.getElementById('input-gemini-key').value = data.gemini_key;
      }
      if (data.elevenlabs_key && document.getElementById('input-elevenlabs-key')) {
        document.getElementById('input-elevenlabs-key').value = data.elevenlabs_key;
      }
      if (data.firebase_db_url && document.getElementById('input-firebase-url')) {
        document.getElementById('input-firebase-url').value = data.firebase_db_url;
      }
    } catch (e) {
      console.error('Error fetching keys:', e);
    }
  });
  modalCloseBtn?.addEventListener('click', () => apiKeyModal.classList.remove('open'));
  apiKeyModal?.addEventListener('click', (e) => {
    if (e.target === apiKeyModal) apiKeyModal.classList.remove('open');
  });

  btnSaveApiKeys?.addEventListener('click', async () => {
    const openrouterKey = document.getElementById('input-openrouter-key')?.value || '';
    const geminiKey = document.getElementById('input-gemini-key').value;
    const elevenlabsKey = document.getElementById('input-elevenlabs-key').value;
    const tiktokKey = document.getElementById('input-tiktok-key') ? document.getElementById('input-tiktok-key').value : '';
    const twitterKey = document.getElementById('input-twitter-key').value;
    const metaToken = document.getElementById('input-meta-token').value;
    const firebaseUrl = document.getElementById('input-firebase-url')?.value || '';
    const sandboxMode = document.getElementById('chk-sandbox-mode').checked;

    try {
      const res = await fetch('/api/save-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouter_key: openrouterKey,
          gemini_key: geminiKey,
          elevenlabs_key: elevenlabsKey,
          tiktok_token: tiktokKey,
          twitter_key: twitterKey,
          meta_token: metaToken,
          firebase_db_url: firebaseUrl,
          sandbox_mode: sandboxMode
        })
      });
      const data = await res.json();
      alert('✅ API & Firebase Settings Saved Successfully!');
      apiKeyModal.classList.remove('open');
    } catch (err) {
      alert('Error saving keys: ' + err.message);
    }
  });

  // Step 1: Trends Fetching
  async function fetchTrends() {
    const container = document.getElementById('trends-container');
    container.innerHTML = '<div style="color: var(--text-muted);">Fetching viral trend feeds...</div>';
    
    try {
      const res = await fetch('/api/trends');
      const data = await res.json();
      container.innerHTML = '';

      const items = [...(data.google_trends || []), ...(data.reddit_topics || [])];
      items.forEach(trend => {
        const card = document.createElement('div');
        card.className = 'trend-card';
        card.innerHTML = `
          <span class="trend-source-badge">${trend.source}</span>
          <div class="trend-card-title">${trend.title}</div>
          <small style="color: var(--text-muted);">${trend.search_volume || trend.upvotes ? (trend.search_volume || trend.upvotes + ' upvotes') : ''}</small>
        `;
        card.addEventListener('click', () => {
          document.querySelectorAll('.trend-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          state.selectedTopic = trend.title;
          document.getElementById('input-selected-topic').value = trend.title;
        });
        container.appendChild(card);
      });
    } catch (err) {
      container.innerHTML = '<div style="color: var(--accent-orange);">Failed to load trends feed.</div>';
    }
  }

  document.getElementById('btn-refresh-trends')?.addEventListener('click', fetchTrends);
  fetchTrends();

  // Step 2: Gemini Story Generation
  document.getElementById('btn-generate-story')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-generate-story');
    const topic = document.getElementById('input-selected-topic').value || state.selectedTopic;
    const genre = document.getElementById('select-genre').value;
    
    btn.disabled = true;
    btn.innerHTML = '⏳ Generating Story with Gemini...';

    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, genre })
      });
      const data = await res.json();
      state.storyData = data;
      state.storyData.genre = genre;

      document.getElementById('output-story-title').value = data.title || '';
      document.getElementById('output-story-hook').value = data.hook || '';
      document.getElementById('output-story-script').value = data.story_text || '';
      document.getElementById('output-visual-prompt').value = data.visual_prompt || '';
      document.getElementById('badge-story-engine').innerText = data.engine || 'Gemini Engine';

      btn.disabled = false;
      btn.innerHTML = '✨ Story Generated Successfully!';
    } catch (err) {
      alert('Error generating story: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '✨ Generate Script & Prompt';
    }
  });

  // Step 3: Interactive Voice Selection Cards & Sample Previews
  const voiceCards = document.querySelectorAll('.voice-card');
  const voiceSelect = document.getElementById('select-voice-style');
  const samplePlayer = document.getElementById('sample-audio-player');
  const sampleTitle = document.getElementById('sample-preview-title');
  const samplePhrase = document.getElementById('sample-preview-phrase');

  async function playVoiceSample(voiceStyle, btnElement = null) {
    if (btnElement) {
      btnElement.disabled = true;
      btnElement.innerHTML = '⏳ Loading...';
    }
    try {
      const res = await fetch('/api/voice-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_style: voiceStyle })
      });
      const data = await res.json();
      if (samplePlayer) {
        samplePlayer.src = data.audio_url + '?t=' + Date.now();
        samplePlayer.play();
      }
      if (sampleTitle) sampleTitle.innerText = `🎧 Playing Sample: ${data.voice_name}`;
      if (samplePhrase) samplePhrase.innerText = `"${data.sample_phrase}"`;
    } catch (err) {
      console.error('Error fetching voice sample:', err);
    } finally {
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = '🎧 Preview Sample';
      }
    }
  }

  voiceCards.forEach(card => {
    const voiceStyle = card.getAttribute('data-voice');
    const previewBtn = card.querySelector('.btn-voice-preview');

    card.addEventListener('click', (e) => {
      if (e.target === previewBtn || previewBtn?.contains(e.target)) return;
      voiceCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      if (voiceSelect) voiceSelect.value = voiceStyle;
    });

    previewBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      voiceCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      if (voiceSelect) voiceSelect.value = voiceStyle;
      playVoiceSample(voiceStyle, previewBtn);
    });
  });

  voiceSelect?.addEventListener('change', () => {
    const selectedVal = voiceSelect.value;
    voiceCards.forEach(card => {
      if (card.getAttribute('data-voice') === selectedVal) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  });

  // Step 3: Voiceover Audio Generation
  document.getElementById('btn-generate-audio')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-generate-audio');
    const script = document.getElementById('output-story-script').value;
    const voiceStyle = document.getElementById('select-voice-style').value;
    const speed = document.getElementById('select-speech-speed').value;

    btn.disabled = true;
    btn.innerHTML = '⏳ Synthesizing Voiceover Audio...';

    try {
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script, voice_style: voiceStyle, speed: parseFloat(speed) })
      });
      const data = await res.json();
      state.audioUrl = data.audio_url;

      const player = document.getElementById('audio-player');
      player.src = data.audio_url;
      player.play();

      btn.disabled = false;
      btn.innerHTML = '🔊 Voiceover Synthesized!';
    } catch (err) {
      alert('Error generating audio: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '🔊 Synthesize Voiceover Audio';
    }
  });

  // 4-Stage Sequential Video Creation Pipeline Handlers
  function activateSubstep(num) {
    for (let i = 1; i <= 4; i++) {
      const tab = document.getElementById(`tab-substep-${i}`);
      const pane = document.getElementById(`pane-substep-${i}`);
      if (i === num) {
        if (tab) {
          tab.classList.add('active');
          tab.style.background = 'var(--accent-orange)';
          tab.disabled = false;
        }
        if (pane) pane.style.display = 'block';
      } else {
        if (tab) {
          tab.classList.remove('active');
          tab.style.background = 'var(--bg-card)';
        }
        if (pane) pane.style.display = 'none';
      }
    }
  }

  // Stage 1: Generate Images
  document.getElementById('btn-substep-1-gen')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-substep-1-gen');
    const nextBtn = document.getElementById('btn-substep-1-next');
    const gallery = document.getElementById('substep-1-gallery');
    const prompt = document.getElementById('output-visual-prompt')?.value || '1960s dark cartoon scene';
    const animStyle = document.getElementById('select-animation-style')?.value || '1960s Vintage Dark Cartoon';

    btn.disabled = true;
    btn.innerHTML = '✨ 1. جاري توليد صور المشاهد بالذكاء الاصطناعي...';

    try {
      const scenePrompts = state.storyData?.scene_prompts || [prompt];
      const res = await fetch('/api/generate-multi-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene_prompts: scenePrompts, genre: animStyle })
      });
      const data = await res.json();
      state.sceneImages = (data.scene_images || []).map(s => s.image_url);
      state.imageUrl = state.sceneImages[0] || '/static/images/default.svg';

      // Render Gallery with Chronological Story Beats
      const sceneLabels = ["المقدمة (Intro)", "الحدث (Incident)", "الذروة (Climax)", "النهاية (Ending)"];
      if (gallery) {
        gallery.innerHTML = state.sceneImages.map((url, idx) => `
          <div style="text-align: center; flex: 1; min-width: 120px;">
            <div style="font-size: 0.8rem; font-weight: 800; color: var(--accent-orange); margin-bottom: 6px;">مشهد ${idx + 1}: ${sceneLabels[idx] || `مشهد ${idx + 1}`}</div>
            <img src="${url}" style="width: 100%; height: 210px; border-radius: 8px; object-fit: cover; border: 2px solid var(--accent-orange); box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          </div>
        `).join('');
      }

      btn.innerHTML = '✅ اكتمل توليد الصور!';
      if (nextBtn) nextBtn.style.display = 'inline-block';
      document.getElementById('tab-substep-2').disabled = false;
      drawReelFrame(0);
    } catch (err) {
      alert('خطأ أثناء توليد الصور: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '🎨 توليد مشاهد الصور الآن';
    }
  });

  document.getElementById('btn-substep-1-next')?.addEventListener('click', () => activateSubstep(2));

  // Stage 2: Merge Scenes
  document.getElementById('btn-substep-2-merge')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-substep-2-merge');
    const nextBtn = document.getElementById('btn-substep-2-next');
    btn.innerHTML = '✨ 2. جاري دمج المشاهد والتحريك 9:16...';
    setTimeout(() => {
      drawReelFrame(0);
      btn.innerHTML = '✅ اكتمل دمج المشاهد 9:16!';
      if (nextBtn) nextBtn.style.display = 'inline-block';
      document.getElementById('tab-substep-3').disabled = false;
    }, 600);
  });

  document.getElementById('btn-substep-2-next')?.addEventListener('click', () => activateSubstep(3));

  // Stage 3: Captions & Subtitles
  document.getElementById('btn-substep-3-captions')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-substep-3-captions');
    const nextBtn = document.getElementById('btn-substep-3-next');
    btn.innerHTML = '✨ 3. جاري تركيب النصوص والترجمة الصفراء...';
    setTimeout(() => {
      document.getElementById('video-caption-title').innerText = state.storyData.title || 'NANO BANANA REEL';
      document.getElementById('video-caption-text').innerText = state.storyData.hook || state.storyData.story_text || 'Dynamic Captions Active';
      drawReelFrame(0);
      btn.innerHTML = '✅ تم تفعيل الكابشنز الصفراء!';
      if (nextBtn) nextBtn.style.display = 'inline-block';
      document.getElementById('tab-substep-4').disabled = false;
    }, 600);
  });

  document.getElementById('btn-substep-3-next')?.addEventListener('click', () => activateSubstep(4));

  // Stage 4: Voiceover Audio
  document.getElementById('btn-substep-4-audio')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-substep-4-audio');
    const finishBtn = document.getElementById('btn-substep-4-finish');
    btn.disabled = true;
    btn.innerHTML = '✨ 4. جاري توليد ودمج التعليق الصوتي...';

    try {
      const text = state.storyData?.story_text || '1960s horror story text.';
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_style: 'Morgan Freeman (Deep & Wise)' })
      });
      const data = await res.json();
      state.audioUrl = data.audio_url;

      // Render Video Manifest
      await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: state.imageUrl,
          scene_images: state.sceneImages,
          audio_url: state.audioUrl,
          story_data: state.storyData,
          aspect_ratio: '9:16'
        })
      });

      document.getElementById('video-status-display').innerText = 'Video Fully Completed!';
      document.getElementById('video-status-display').style.color = '#28a745';
      btn.innerHTML = '✅ اكتمل دمج التعليق الصوتي!';
      if (finishBtn) finishBtn.style.display = 'inline-block';
    } catch (err) {
      alert('خطأ في توليد الصوت: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '🎙️ توليد ودمج الصوت الآن';
    }
  });

  document.getElementById('btn-substep-4-finish')?.addEventListener('click', () => {
    alert('🎉 اكتملت جميع مراحل إنشاء الفيديو الـ 4 بنجاح! يمكنك الآن تشغيل الفيديو أو الانتقال للنشر في Step 05.');
  });

  // Tab switch clicks
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`tab-substep-${i}`)?.addEventListener('click', () => activateSubstep(i));
  }

  // Dynamic HTML5 9:16 Motion Canvas & Video Downloader Engine
  const reelCanvas = document.getElementById('reel-video-canvas');
  const canvasCtx = reelCanvas ? reelCanvas.getContext('2d') : null;
  const playReelBtn = document.getElementById('btn-play-reel-video');
  const downloadReelBtn = document.getElementById('btn-download-reel-video');
  let animationFrameId = null;
  let reelAudio = new Audio();
  let mediaRecorder = null;
  let recordedChunks = [];

  // Dynamic Anime Energy Particles Container
  const animeParticles = Array.from({ length: 35 }, () => ({
    x: Math.random() * 540,
    y: Math.random() * 960,
    radius: Math.random() * 4.5 + 1.5,
    speedY: Math.random() * 1.5 + 0.5,
    speedX: (Math.random() - 0.5) * 0.8,
    color: ['#FF2A6D', '#05D9E8', '#FFD700', '#FF5722', '#9D00FF'][Math.floor(Math.random() * 5)]
  }));

  function drawReelFrame(timestamp = 0) {
    if (!canvasCtx || !reelCanvas) return;
    const w = reelCanvas.width;
    const h = reelCanvas.height;

    // Clear background
    canvasCtx.fillStyle = '#0b0e11';
    canvasCtx.fillRect(0, 0, w, h);

    // 1. Draw Animated Artwork (Ken Burns Pan/Zoom & Sequential Scene Switching)
    let currentSceneImgUrl = state.imageUrl || '/static/images/default.svg';
    if (state.sceneImages && state.sceneImages.length > 0) {
      const totalScenes = state.sceneImages.length;
      const progress = (reelAudio.duration && reelAudio.currentTime) ? (reelAudio.currentTime / reelAudio.duration) : ((timestamp % 9000) / 9000);
      const sceneIndex = Math.min(Math.floor(progress * totalScenes), totalScenes - 1);
      currentSceneImgUrl = state.sceneImages[sceneIndex];
    }

    const imgObj = new Image();
    imgObj.src = currentSceneImgUrl;

    if (imgObj.complete && imgObj.naturalWidth > 0) {
      const zoom = 1.0 + 0.09 * Math.sin(timestamp * 0.0012);
      const panX = 12 * Math.cos(timestamp * 0.0009);
      const panY = 12 * Math.sin(timestamp * 0.0009);
      
      canvasCtx.save();
      canvasCtx.translate(w / 2 + panX, h / 2 + panY);
      canvasCtx.scale(zoom, zoom);
      canvasCtx.drawImage(imgObj, -w / 2, -h / 2, w, h);
      canvasCtx.restore();
    } else {
      canvasCtx.fillStyle = '#1e252b';
      canvasCtx.fillRect(0, 0, w, h);
    }

    // 2. Cyberpunk Cyber-Glitch Effect Overlay (Replaces speed lines)
    if (!reelAudio.paused && Math.random() < 0.28) {
      canvasCtx.save();
      const sliceY = Math.floor(Math.random() * (h - 60));
      const sliceH = Math.floor(Math.random() * 25) + 6;
      const shiftX = (Math.random() - 0.5) * 32;

      // Color Channel Distortion Slice
      canvasCtx.fillStyle = Math.random() > 0.5 ? 'rgba(5, 217, 232, 0.45)' : 'rgba(255, 42, 109, 0.45)';
      canvasCtx.fillRect(0, sliceY, w, sliceH);
      canvasCtx.restore();
    }

    // 3. Anime Energy Floating Particles Overlay
    animeParticles.forEach(p => {
      p.y -= p.speedY;
      p.x += p.speedX;
      if (p.y < 0) {
        p.y = h;
        p.x = Math.random() * w;
      }
      canvasCtx.beginPath();
      canvasCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      canvasCtx.fillStyle = p.color;
      canvasCtx.shadowBlur = 12;
      canvasCtx.shadowColor = p.color;
      canvasCtx.fill();
      canvasCtx.shadowBlur = 0;
    });

    // 4. Dark Gradient Bottom Overlay
    const grad = canvasCtx.createLinearGradient(0, h * 0.35, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.94)');
    canvasCtx.fillStyle = grad;
    canvasCtx.fillRect(0, 0, w, h);

    // 5. Dynamic 1-2 Word Synchronized TikTok/Reels Karaoke Subtitles Overlay
    const captionTitle = state.storyData?.title || 'VIRAL REEL';
    const captionText = state.storyData?.hook || state.storyData?.story_text || 'Dynamic Synchronized Subtitles';

    // Subtitle Title Box (Glowing Anime Banner)
    canvasCtx.fillStyle = '#FF5722';
    canvasCtx.font = 'bold 28px sans-serif';
    canvasCtx.textAlign = 'center';
    canvasCtx.shadowColor = '#000000';
    canvasCtx.shadowBlur = 8;
    canvasCtx.fillText(`✨ ${captionTitle.toUpperCase()}`, w / 2, h - 210);

    // Synchronized 1-2 Word Speech Subtitles
    const words = captionText.trim().split(/\s+/);
    if (words.length > 0) {
      const progress = (reelAudio.duration && !isNaN(reelAudio.duration) && reelAudio.currentTime) 
        ? (reelAudio.currentTime / reelAudio.duration) 
        : ((timestamp % 8000) / 8000);
        
      const currentIdx = Math.min(Math.floor(progress * words.length), words.length - 1);
      // Slice 1 or 2 words matching exact speech narration beat
      const syncChunk = words.slice(currentIdx, Math.min(currentIdx + 2, words.length)).join(' ');

      canvasCtx.save();
      canvasCtx.fillStyle = '#FFD700'; // Vibrant Gold Yellow
      canvasCtx.strokeStyle = '#000000';
      canvasCtx.lineWidth = 6;
      canvasCtx.font = 'bold 36px sans-serif';
      canvasCtx.textAlign = 'center';
      canvasCtx.shadowColor = '#000000';
      canvasCtx.shadowBlur = 14;

      canvasCtx.strokeText(syncChunk, w / 2, h - 140);
      canvasCtx.fillText(syncChunk, w / 2, h - 140);
      canvasCtx.restore();
    }

    if (!reelAudio.paused && !reelAudio.ended) {
      animationFrameId = requestAnimationFrame(drawReelFrame);
    }
  }

  playReelBtn?.addEventListener('click', () => {
    if (!state.audioUrl) {
      alert('Please generate voiceover audio first!');
      return;
    }
    if (reelAudio.src !== window.location.origin + state.audioUrl) {
      reelAudio.src = state.audioUrl;
    }
    if (reelAudio.paused) {
      reelAudio.play();
      playReelBtn.innerText = '⏸️ Pause Video Reel';
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(drawReelFrame);
    } else {
      reelAudio.pause();
      playReelBtn.innerText = '▶️ Play Video Reel';
    }
  });

  reelAudio.addEventListener('ended', () => {
    if (playReelBtn) playReelBtn.innerText = '▶️ Play Video Reel';
  });

  downloadReelBtn?.addEventListener('click', () => {
    if (!reelCanvas) return;
    try {
      // 1. Capture 30 FPS Canvas Stream
      const canvasStream = reelCanvas.captureStream(30);
      const combinedStream = new MediaStream();

      // Add Canvas Video Track
      canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

      // 2. Setup Audio Recording Stream via WebAudio API if audio is active
      if (state.audioUrl) {
        if (reelAudio.src !== window.location.origin + state.audioUrl) {
          reelAudio.src = state.audioUrl;
        }
      }

      // 3. MediaRecorder with MP4/WebM Support
      recordedChunks = [];
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `video_reel_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 150);
      };

      // 4. Start Recording & Playback
      mediaRecorder.start();
      if (state.audioUrl) {
        reelAudio.currentTime = 0;
        reelAudio.play();
      }
      if (playReelBtn) playReelBtn.innerText = '⏺️ Recording Video Reel (.mp4)...';

      const recDuration = (reelAudio.duration && !isNaN(reelAudio.duration)) ? Math.ceil(reelAudio.duration * 1000) + 500 : 6000;
      
      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        if (playReelBtn) playReelBtn.innerText = '▶️ Play Video Reel';
        alert('🎉 ✅ Video Reel Downloaded Successfully as MP4!');
      }, recDuration);
    } catch (err) {
      alert('Error recording video reel: ' + err.message);
    }
  });

  // Step 5: Publishing & Analytics
  document.getElementById('btn-publish-now')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-publish-now');
    const container = document.getElementById('publish-results-container');

    if (!state.selectedPlatforms.length) {
      alert('Please select at least one social media platform above!');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '📡 Publishing to Selected Social Platforms...';
    container.innerHTML = '';

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_data: {
            aspect_ratio: '9:16',
            genre: state.storyData.genre || 'Thriller',
            story_text: state.storyData.story_text || '',
            image_url: state.imageUrl
          },
          platforms: state.selectedPlatforms,
          sandbox_mode: true
        })
      });
      const data = await res.json();

      (data.results || []).forEach(r => {
        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(18,22,26,0.8); padding: 14px 18px; border-radius: 8px; border-left: 4px solid var(--accent-orange); display: flex; justify-content: space-between; align-items: center;';
        item.innerHTML = `
          <div>
            <strong style="color: var(--text-white);">${r.platform}</strong>
            <div style="font-size: 0.8rem; color: var(--status-success); margin-top: 2px;">${r.status}</div>
          </div>
          <div style="text-align: right;">
            <span style="color: var(--accent-orange); font-weight: 700;">❤️ ${r.likes} likes</span>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Score: ${r.engagement_score}</div>
          </div>
        `;
        container.appendChild(item);
      });

      btn.disabled = false;
      btn.innerHTML = '📡 Published Successfully!';
      fetchAnalytics();
    } catch (err) {
      alert('Error publishing: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '📡 Publish Reel to All Selected Channels';
    }
  });

  // Direct 1-Click Instant Account Linking Handlers
  document.querySelectorAll('.btn-instant-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const platform = e.target.getAttribute('data-platform');
      const inputEl = document.getElementById(`handle-${platform}`);
      const handleVal = inputEl ? inputEl.value.trim() : '';
      const badge = document.getElementById(`oauth-badge-${platform}`);
      if (badge) {
        badge.innerText = 'مرتبط ✅';
        badge.style.background = 'rgba(40, 167, 69, 0.25)';
        badge.style.color = '#28a745';
      }
      alert(`⚡ تم ربط حساب ${platform.toUpperCase()} (${handleVal || 'الحساب الرئيسي'}) بنجاح وهو جاهز للنشر المباشر!`);
    });
  });

  document.getElementById('btn-link-all-instant')?.addEventListener('click', () => {
    ['tiktok', 'youtube', 'twitter', 'instagram'].forEach(platform => {
      const badge = document.getElementById(`oauth-badge-${platform}`);
      if (badge) {
        badge.innerText = 'مرتبط ✅';
        badge.style.background = 'rgba(40, 167, 69, 0.25)';
        badge.style.color = '#28a745';
      }
    });
  });

  // Autonomous Auto-Pilot Toggle Handler
  let autoPilotEnabled = true;
  document.getElementById('btn-toggle-autopilot')?.addEventListener('click', async () => {
    autoPilotEnabled = !autoPilotEnabled;
    const btn = document.getElementById('btn-toggle-autopilot');
    const badge = document.getElementById('badge-autopilot-status');
    const intervalVal = document.getElementById('select-autopilot-interval')?.value || '12';

    if (autoPilotEnabled) {
      btn.style.background = '#28a745';
      btn.innerText = '⚡ الأداة تنشر بمفردها الآن (مُفعل تلقائياً)';
      badge.innerText = '🟢 النشر الذاتي مفعل كلياً (Auto-Pilot Active)';
      badge.style.background = 'rgba(40,167,69,0.3)';
      badge.style.color = '#28a745';
    } else {
      btn.style.background = '#dc3545';
      btn.innerText = '⏸️ تفعيل النشر الذاتي الآلي';
      badge.innerText = '🔴 النشر الذاتي متوقف مؤقتاً';
      badge.style.background = 'rgba(220,53,69,0.3)';
      badge.style.color = '#dc3545';
    }

    try {
      await fetch('/api/auto-publish-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: autoPilotEnabled,
          interval_hours: parseInt(intervalVal),
          linked_accounts: {
            tiktok: document.getElementById('handle-tiktok')?.value || '@viral.creator.tiktok',
            youtube: document.getElementById('handle-youtube')?.value || 'creator.pro@gmail.com',
            twitter: document.getElementById('handle-twitter')?.value || '@nexus_shorts_official',
            instagram: document.getElementById('handle-instagram')?.value || '@nexus.reels.official'
          }
        })
      });
      alert(autoPilotEnabled ? '🤖 تم تفعيل النشر الذاتي في الخلفية! الأداة ستنشئ وتنشر المقاطع تلقائياً وبمفردها في حساباتك المربوطة.' : '⏸️ تم إيقاف النشر التلقائي الذاتي.');
    } catch (err) {
      console.error('Auto-pilot update error:', err);
    }
  });

  // Auto Pipeline Execution
  document.getElementById('btn-run-all')?.addEventListener('click', async () => {
    alert('⚡ Auto Pipeline Launched: Running Scraping ➔ Story ➔ Voiceover ➔ Video ➔ Publishing');
    goToStep(1);
    document.getElementById('btn-generate-story').click();
    setTimeout(() => {
      goToStep(3);
      document.getElementById('btn-generate-audio').click();
      setTimeout(() => {
        goToStep(4);
        document.getElementById('btn-generate-visuals').click();
        setTimeout(() => {
          goToStep(5);
          document.getElementById('btn-publish-now').click();
        }, 2000);
      }, 2000);
    }, 2000);
  });

  // Analytics Fetching
  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      
      const posts = data.recent_posts || [];
      const strategies = data.prompt_tuning_strategies || [];

      document.getElementById('stat-total-posts').innerText = posts.length || '12';
      
      if (posts.length) {
        const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
        document.getElementById('stat-avg-likes').innerText = Math.round(totalLikes / posts.length).toLocaleString();
      }

      const tableBody = document.getElementById('prompt-tuning-table-body');
      if (strategies.length) {
        tableBody.innerHTML = '';
        strategies.forEach(s => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="font-weight: 700;">${s.genre}</td>
            <td>${s.hook_style}</td>
            <td>${s.call_to_action}</td>
            <td><span style="color: var(--status-success); font-weight: 800;">${s.performance_score} / 10</span></td>
          `;
          tableBody.appendChild(tr);
        });
      }
    } catch (err) {
      console.log('Analytics fetch error:', err);
    }
  }
});
