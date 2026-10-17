/**
 * WanderMemories - Cinematic Showcase & Stories Presentation Mode
 * Perfect for showing travel memories to family, friends, or on TV/Projector
 */

class StoryShowcase {
  constructor() {
    this.memories = [];
    this.currentIndex = 0;
    this.timer = null;
    this.duration = 7500; // 7.5 seconds per photo
    this.isPaused = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.ambientSoundWasOn = false;

    this.container = null;
  }

  start(memories, startIndex = 0) {
    if (!memories || memories.length === 0) return;
    this.memories = memories;
    this.currentIndex = Math.max(0, Math.min(startIndex, memories.length - 1));

    this.container = document.getElementById('story-modal');
    if (!this.container) return;

    this.container.classList.remove('hidden');
    document.body.classList.add('modal-open');

    // Auto-enable soothing travel soundtrack in story mode if desired
    if (window.soundEngine && !window.soundEngine.ambientPlaying) {
      window.soundEngine.startAmbient();
      this.ambientSoundWasOn = true;
      const soundBtn = document.getElementById('story-sound-toggle');
      if (soundBtn) soundBtn.classList.add('active');
    }

    this.renderCurrentSlide();
    this.bindKeyboard();
  }

  renderCurrentSlide() {
    clearTimeout(this.timer);
    this.elapsedTime = 0;
    this.isPaused = false;

    const mem = this.memories[this.currentIndex];
    const total = this.memories.length;

    // Render Progress Bars
    const progressContainer = document.getElementById('story-progress-bars');
    if (progressContainer) {
      progressContainer.innerHTML = this.memories.map((_, i) => {
        let cls = 'story-bar';
        if (i < this.currentIndex) cls += ' completed';
        else if (i === this.currentIndex) cls += ' active';
        return `<div class="${cls}"><div class="story-bar-fill" id="story-fill-${i}"></div></div>`;
      }).join('');
    }

    // Render Media (Photo or Video)
    const mediaContainer = document.getElementById('story-media-container');
    if (mediaContainer) {
      if (mem.mediaType === 'video') {
        mediaContainer.innerHTML = `
          <video id="story-video" src="${mem.mediaUrl}" autoplay playsinline class="story-media video-player"></video>
        `;
        const video = document.getElementById('story-video');
        if (video) {
          video.onended = () => this.next();
          video.onplay = () => this.startProgressVideo(video);
          video.onerror = () => {
            console.warn('Video failed to play, advancing in 5s');
            this.startProgressPhoto(5000);
          };
        }
      } else {
        mediaContainer.innerHTML = `
          <div class="story-image-wrap">
            <img src="${mem.mediaUrl}" alt="${mem.title}" class="story-media ken-burns" id="story-photo" />
          </div>
        `;
        this.startProgressPhoto(this.duration);
      }
    }

    // Render Info Card
    const titleEl = document.getElementById('story-title');
    const locEl = document.getElementById('story-location');
    const dateEl = document.getElementById('story-date');
    const noteEl = document.getElementById('story-notes');
    const badgeEl = document.getElementById('story-badge');
    const moodEl = document.getElementById('story-mood');
    const companionEl = document.getElementById('story-companions');

    if (titleEl) titleEl.textContent = mem.title;
    if (locEl) locEl.textContent = `${mem.spot ? mem.spot + ', ' : ''}${mem.city}, ${mem.country}`;
    if (dateEl) dateEl.textContent = mem.date + (mem.season ? ` • ${mem.season}` : '');
    if (noteEl) noteEl.textContent = mem.notes || '';
    if (moodEl) moodEl.textContent = mem.mood ? `✨ ${mem.mood}` : '';
    if (companionEl) companionEl.textContent = mem.companions ? `👥 ${mem.companions}` : '';

    if (badgeEl) {
      const catText = mem.category === 'antar_negeri' ? '✈️ Antar Negeri' : mem.category === 'antar_kota' ? '🚅 Antar Kota' : '🏞️ Daerah/Alam';
      badgeEl.textContent = catText;
    }
  }

  startProgressPhoto(duration) {
    const fillEl = document.getElementById(`story-fill-${this.currentIndex}`);
    if (fillEl) {
      fillEl.style.transition = 'none';
      fillEl.style.width = '0%';
      // Force repaint
      fillEl.offsetHeight;
      fillEl.style.transition = `width ${duration}ms linear`;
      fillEl.style.width = '100%';
    }

    this.startTime = Date.now();
    this.timer = setTimeout(() => {
      this.next();
    }, duration);
  }

  startProgressVideo(video) {
    const update = () => {
      if (!this.container || this.container.classList.contains('hidden')) return;
      if (video && !video.paused && !video.ended && video.duration) {
        const fillEl = document.getElementById(`story-fill-${this.currentIndex}`);
        if (fillEl) {
          const percent = (video.currentTime / video.duration) * 100;
          fillEl.style.transition = 'none';
          fillEl.style.width = `${percent}%`;
        }
        requestAnimationFrame(update);
      }
    };
    requestAnimationFrame(update);
  }

  next() {
    if (this.currentIndex < this.memories.length - 1) {
      this.currentIndex++;
      this.renderCurrentSlide();
    } else {
      // Loop back or close
      this.close();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCurrentSlide();
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const video = document.getElementById('story-video');
    const fillEl = document.getElementById(`story-fill-${this.currentIndex}`);

    if (this.isPaused) {
      if (video && !video.paused) video.pause();
      clearTimeout(this.timer);
      this.elapsedTime += Date.now() - this.startTime;
      if (fillEl) {
        const computedWidth = window.getComputedStyle(fillEl).width;
        fillEl.style.transition = 'none';
        fillEl.style.width = computedWidth;
      }
    } else {
      if (video && video.paused) video.play();
      const remaining = Math.max(1000, this.duration - this.elapsedTime);
      this.startProgressPhoto(remaining);
    }
  }

  close() {
    clearTimeout(this.timer);
    const video = document.getElementById('story-video');
    if (video) video.pause();

    if (this.container) {
      this.container.classList.add('hidden');
    }
    document.body.classList.remove('modal-open');
    this.unbindKeyboard();

    if (this.ambientSoundWasOn && window.soundEngine) {
      window.soundEngine.stopAmbient();
      this.ambientSoundWasOn = false;
    }
  }

  bindKeyboard() {
    this._keyHandler = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  unbindKeyboard() {
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }
}

window.storyShowcase = new StoryShowcase();
