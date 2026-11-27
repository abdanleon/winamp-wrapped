    const MAX_SONGS = 10;
    const MIN_RECOMMENDED_SONGS = 5;

    let selectedSongs = [];
    let selectedCategory = '';
    let isDarkMode = false;
    let searchDebounceTimer = null;
    let activeSearchController = null;

    const catWeekBtn = document.getElementById('cat-week-btn');
    const catMonthBtn = document.getElementById('cat-month-btn');
    const catYearBtn = document.getElementById('cat-year-btn');
    const waCanvasHeading = document.getElementById('wa-canvas-heading');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    const searchInput = document.getElementById('itunes-search-input');
    const searchSpinner = document.getElementById('search-spinner');
    const searchDropdown = document.getElementById('search-results-dropdown');

    const manualInput = document.getElementById('manual-song-input');
    const addManualBtn = document.getElementById('add-manual-btn');

    const trackCounterBadge = document.getElementById('track-counter-badge');
    const statusBanner = document.getElementById('status-banner');
    const emptyEditorState = document.getElementById('empty-editor-state');
    const selectedSongsList = document.getElementById('selected-songs-list');
    const clearAllBtn = document.getElementById('clear-all-btn');

    const waMainTimer = document.getElementById('wa-main-timer');
    const waNowPlayingTitle = document.getElementById('wa-now-playing-title');
    const waPlaylistScreen = document.getElementById('wa-playlist-screen');
    const waTotalDuration = document.getElementById('wa-total-duration');
    const waTrackCountFooter = document.getElementById('wa-track-count-footer');

    const previewStage = document.getElementById('preview-stage');
    const previewScaleWrapper = document.getElementById('preview-scale-wrapper');
    const captureCanvas = document.getElementById('winamp-capture-canvas');
    const downloadBtn = document.getElementById('download-btn');
    const downloadBtnText = document.getElementById('download-btn-text');

    function generateRandomDurationSeconds() {
      const minSec = 120;
      const maxSec = 299;
      return Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
    }

    function formatSecondsToMMSS(totalSeconds) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      return `${mm}:${ss}`;
    }

    function showStatusMessage(message, type = 'info') {
      statusBanner.textContent = message;
      statusBanner.classList.remove(
        'hidden',
        'bg-rose-50', 'border-rose-200', 'text-rose-700', 'dark:bg-rose-950/60', 'dark:border-rose-800', 'dark:text-rose-300',
        'bg-amber-50', 'border-amber-200', 'text-amber-800', 'dark:bg-amber-950/60', 'dark:border-amber-800', 'dark:text-amber-300',
        'bg-emerald-50', 'border-emerald-200', 'text-emerald-700', 'dark:bg-emerald-950/60', 'dark:border-emerald-800', 'dark:text-emerald-300'
      );

      if (type === 'error') {
        statusBanner.classList.add('bg-rose-50', 'border-rose-200', 'text-rose-700', 'dark:bg-rose-950/60', 'dark:border-rose-800', 'dark:text-rose-300');
      } else if (type === 'warning') {
        statusBanner.classList.add('bg-amber-50', 'border-amber-200', 'text-amber-800', 'dark:bg-amber-950/60', 'dark:border-amber-800', 'dark:text-amber-300');
      } else {
        statusBanner.classList.add('bg-emerald-50', 'border-emerald-200', 'text-emerald-700', 'dark:bg-emerald-950/60', 'dark:border-emerald-800', 'dark:text-emerald-300');
      }

      clearTimeout(statusBanner._hideTimeout);
      statusBanner._hideTimeout = setTimeout(() => {
        statusBanner.classList.add('hidden');
      }, 3500);
    }

    function escapeHTML(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function updateCategoryUI() {
      const inactiveClasses = [
        'bg-slate-50', 'dark:bg-slate-800',
        'border-slate-300', 'dark:border-slate-700',
        'text-slate-700', 'dark:text-slate-300',
        'hover:border-emerald-500', 'dark:hover:border-emerald-500'
      ];
      const activeClasses = [
        'bg-emerald-600', 'dark:bg-emerald-600',
        'border-emerald-600', 'dark:border-emerald-500',
        'text-white', 'dark:text-white',
        'shadow-sm'
      ];

      [catWeekBtn, catMonthBtn, catYearBtn].forEach((btn) => {
        btn.classList.remove(...activeClasses);
        btn.classList.add(...inactiveClasses);
      });

      if (selectedCategory === 'week') {
        catWeekBtn.classList.remove(...inactiveClasses);
        catWeekBtn.classList.add(...activeClasses);
        waCanvasHeading.textContent = 'MY TOP PLAYLIST THIS WEEK';
      } else if (selectedCategory === 'month') {
        catMonthBtn.classList.remove(...inactiveClasses);
        catMonthBtn.classList.add(...activeClasses);
        waCanvasHeading.textContent = 'MY TOP PLAYLIST THIS MONTH';
      } else if (selectedCategory === 'year') {
        catYearBtn.classList.remove(...inactiveClasses);
        catYearBtn.classList.add(...activeClasses);
        waCanvasHeading.textContent = 'MY TOP PLAYLIST THIS YEAR';
      } else {
        waCanvasHeading.textContent = 'MY TOP PLAYLIST';
      }
    }

    catWeekBtn.addEventListener('click', () => {
      selectedCategory = selectedCategory === 'week' ? '' : 'week';
      updateCategoryUI();
    });

    catMonthBtn.addEventListener('click', () => {
      selectedCategory = selectedCategory === 'month' ? '' : 'month';
      updateCategoryUI();
    });

    catYearBtn.addEventListener('click', () => {
      selectedCategory = selectedCategory === 'year' ? '' : 'year';
      updateCategoryUI();
    });

    themeToggleBtn.addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        themeToggleBtn.textContent = 'Mode Terang';
      } else {
        document.documentElement.classList.remove('dark');
        themeToggleBtn.textContent = 'Mode Gelap';
      }
    });

    function initStaticSpectrumAnalyzer() {
      const container = document.getElementById('wa-spectrum-container');
      const barHeights = [5, 8, 11, 9, 6, 10, 12, 8, 7, 11, 9, 6, 8, 10, 7, 5, 9, 6, 4, 3];

      container.innerHTML = barHeights.map((height) => {
        let segmentsHTML = '';
        for (let level = 1; level <= height; level++) {
          let color = '#008000';
          if (level >= 11) {
            color = '#FF0000';
          } else if (level >= 9) {
            color = '#FF9900';
          } else if (level >= 7) {
            color = '#FFFF00';
          } else if (level >= 4) {
            color = '#00FF00';
          }
          segmentsHTML += `<div class="wa-spec-seg" style="background-color: ${color};"></div>`;
        }
        return `<div class="wa-spec-col">${segmentsHTML}</div>`;
      }).join('');
    }

    function initStaticEqualizer() {
      const container = document.getElementById('wa-eq-bands');
      const bands = [
        { label: '70', top: 42 },
        { label: '180', top: 58 },
        { label: '320', top: 84 },
        { label: '600', top: 78 },
        { label: '1K', top: 64 },
        { label: '3K', top: 46 },
        { label: '6K', top: 34 },
        { label: '12K', top: 40 },
        { label: '14K', top: 28 },
        { label: '16K', top: 36 }
      ];

      container.innerHTML = bands.map((band) => `
        <div class="wa-eq-col">
          <div class="wa-eq-rail">
            <div class="wa-eq-knob" style="top: ${band.top}px;">
              <span></span><span></span>
            </div>
          </div>
          <span style="font-family: 'Share Tech Mono', monospace; font-size: 18px; color: #FFFFFF;">${band.label}</span>
        </div>
      `).join('');
    }

    function addSongToPlaylist(artist, title) {
      if (selectedSongs.length >= MAX_SONGS) {
        showStatusMessage(`Maksimal ${MAX_SONGS} lagu sudah tercapai. Hapus salah satu jika ingin mengganti.`, 'warning');
        return false;
      }

      const cleanArtist = (artist || '').trim();
      const cleanTitle = (title || '').trim();
      const displayFull = cleanArtist ? `${cleanArtist} - ${cleanTitle}` : cleanTitle;

      if (!displayFull) {
        showStatusMessage('Judul lagu tidak boleh kosong.', 'error');
        return false;
      }

      const durationSec = generateRandomDurationSeconds();
      selectedSongs.push({
        id: Date.now() + Math.random(),
        artist: cleanArtist,
        title: cleanTitle,
        displayText: displayFull,
        durationSec,
        durationFormatted: formatSecondsToMMSS(durationSec)
      });

      renderAll();
      return true;
    }

    function removeSongAtIndex(index) {
      selectedSongs.splice(index, 1);
      renderAll();
    }

    function moveSong(index, direction) {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= selectedSongs.length) return;
      const temp = selectedSongs[index];
      selectedSongs[index] = selectedSongs[targetIndex];
      selectedSongs[targetIndex] = temp;
      renderAll();
    }

    function renderAll() {
      renderEditorList();
      renderWinampLiveView();
    }

    function renderEditorList() {
      const count = selectedSongs.length;
      trackCounterBadge.textContent = `${count} / ${MAX_SONGS} Lagu`;

      if (count >= MAX_SONGS) {
        trackCounterBadge.classList.remove('bg-emerald-50', 'dark:bg-emerald-950/60', 'text-emerald-700', 'dark:text-emerald-400', 'border-emerald-200', 'dark:border-emerald-800');
        trackCounterBadge.classList.add('bg-amber-50', 'dark:bg-amber-950/60', 'text-amber-700', 'dark:text-amber-400', 'border-amber-200', 'dark:border-amber-800');
      } else {
        trackCounterBadge.classList.remove('bg-amber-50', 'dark:bg-amber-950/60', 'text-amber-700', 'dark:text-amber-400', 'border-amber-200', 'dark:border-amber-800');
        trackCounterBadge.classList.add('bg-emerald-50', 'dark:bg-emerald-950/60', 'text-emerald-700', 'dark:text-emerald-400', 'border-emerald-200', 'dark:border-emerald-800');
      }

      if (count === 0) {
        emptyEditorState.classList.remove('hidden');
        selectedSongsList.innerHTML = '';
        clearAllBtn.classList.add('hidden');
        return;
      }

      emptyEditorState.classList.add('hidden');
      clearAllBtn.classList.remove('hidden');

      selectedSongsList.innerHTML = selectedSongs.map((song, idx) => {
        const isFirst = idx === 0;
        return `
          <li class="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/70 border ${isFirst ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'} rounded-xl px-3 py-2.5">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <span class="w-6 h-6 rounded-lg ${isFirst ? 'bg-emerald-600 text-white font-extrabold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold'} text-xs flex items-center justify-center shrink-0">
                ${idx + 1}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-slate-900 dark:text-white truncate" title="${escapeHTML(song.displayText)}">
                  ${escapeHTML(song.displayText)}
                </p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  Durasi: <span class="text-slate-700 dark:text-slate-200 font-mono">${song.durationFormatted}</span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onclick="moveSong(${idx}, -1)"
                ${idx === 0 ? 'disabled' : ''}
                title="Geser Naik"
                class="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              >
                ▲
              </button>
              <button
                type="button"
                onclick="moveSong(${idx}, 1)"
                ${idx === count - 1 ? 'disabled' : ''}
                title="Geser Turun"
                class="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              >
                ▼
              </button>
              <button
                type="button"
                onclick="removeSongAtIndex(${idx})"
                title="Hapus Lagu"
                class="ml-1 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold transition cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </li>
        `;
      }).join('');
    }

    function renderWinampLiveView() {
      const count = selectedSongs.length;

      if (count > 0) {
        const firstSong = selectedSongs[0];
        waMainTimer.textContent = firstSong.durationFormatted;
        waNowPlayingTitle.textContent = `1. ${firstSong.displayText} (${firstSong.durationFormatted})`;
      } else {
        waMainTimer.textContent = '00:00';
        waNowPlayingTitle.textContent = '1. Pilih atau tulis lagu favoritmu...';
      }

      if (count === 0) {
        waPlaylistScreen.innerHTML = `
          <div class="wa-playlist-row is-playing">
            <span class="wa-track-label">1. Tambahkan 5-10 lagu favoritmu...</span>
            <span class="wa-track-time">00:00</span>
          </div>
        `;
        waTotalDuration.textContent = '00:00/00:00';
        waTrackCountFooter.textContent = '0 TRACKS';
        return;
      }

      let totalSeconds = 0;
      waPlaylistScreen.innerHTML = selectedSongs.map((song, idx) => {
        totalSeconds += song.durationSec;
        const isPlaying = idx === 0;
        return `
          <div class="wa-playlist-row ${isPlaying ? 'is-playing' : ''}">
            <span class="wa-track-label">${idx + 1}. ${escapeHTML(song.displayText)}</span>
            <span class="wa-track-time">${song.durationFormatted}</span>
          </div>
        `;
      }).join('');

      const formattedTotal = formatSecondsToMMSS(totalSeconds);
      const firstDuration = selectedSongs[0].durationFormatted;
      waTotalDuration.textContent = `${firstDuration}/${formattedTotal}`;
      waTrackCountFooter.textContent = `${count} TRACK${count > 1 ? 'S' : ''}`;
    }

    async function searchItunesSongs(query) {
      if (activeSearchController) {
        activeSearchController.abort();
      }
      activeSearchController = new AbortController();

      searchSpinner.classList.remove('hidden');

      try {
        const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=6`;
        const response = await fetch(endpoint, { signal: activeSearchController.signal });
        if (!response.ok) throw new Error('Gagal mengambil data lagu');

        const data = await response.json();
        renderSearchDropdown(data.results || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          searchDropdown.innerHTML = `
            <div class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
              Tidak dapat memuat hasil pencarian. Kamu tetap bisa tulis lagu manual di bawah.
            </div>
          `;
          searchDropdown.classList.remove('hidden');
        }
      } finally {
        searchSpinner.classList.add('hidden');
      }
    }

    function renderSearchDropdown(results) {
      if (!results.length) {
        searchDropdown.innerHTML = `
          <div class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
            Lagu tidak ditemukan. Coba kata kunci lain atau ketik manual di kolom bawah.
          </div>
        `;
        searchDropdown.classList.remove('hidden');
        return;
      }

      searchDropdown.innerHTML = results.map((item, idx) => {
        const artist = item.artistName || 'Unknown Artist';
        const track = item.trackName || 'Unknown Track';
        const artwork = item.artworkUrl60 || '';

        return `
          <button
            type="button"
            data-idx="${idx}"
            class="search-result-item w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition cursor-pointer"
          >
            <img
              src="${escapeHTML(artwork)}"
              alt=""
              onerror="this.style.display='none'"
              class="w-9 h-9 rounded-md object-cover bg-slate-200 dark:bg-slate-700 shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">${escapeHTML(track)}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${escapeHTML(artist)}</p>
            </div>
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">+ Pilih</span>
          </button>
        `;
      }).join('');

      searchDropdown._results = results;
      searchDropdown.classList.remove('hidden');
    }

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(searchDebounceTimer);

      if (query.length < 2) {
        searchDropdown.classList.add('hidden');
        searchSpinner.classList.add('hidden');
        return;
      }

      searchDebounceTimer = setTimeout(() => {
        searchItunesSongs(query);
      }, 350);
    });

    searchDropdown.addEventListener('click', (e) => {
      const btn = e.target.closest('.search-result-item');
      if (!btn) return;

      const idx = Number(btn.getAttribute('data-idx'));
      const item = searchDropdown._results?.[idx];
      if (!item) return;

      const added = addSongToPlaylist(item.artistName, item.trackName);
      if (added) {
        searchInput.value = '';
        searchDropdown.classList.add('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.add('hidden');
      }
    });

    function handleManualAdd() {
      const rawValue = manualInput.value.trim();
      if (!rawValue) {
        showStatusMessage('Ketik nama penyanyi dan judul lagu terlebih dahulu.', 'warning');
        manualInput.focus();
        return;
      }

      let artist = '';
      let title = rawValue;

      if (rawValue.includes(' - ')) {
        const parts = rawValue.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      } else if (rawValue.includes('-')) {
        const parts = rawValue.split('-');
        artist = parts[0].trim();
        title = parts.slice(1).join('-').trim();
      }

      const added = addSongToPlaylist(artist, title);
      if (added) {
        manualInput.value = '';
        manualInput.focus();
      }
    }

    addManualBtn.addEventListener('click', handleManualAdd);
    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleManualAdd();
      }
    });

    clearAllBtn.addEventListener('click', () => {
      selectedSongs = [];
      renderAll();
    });

    function updatePreviewScale() {
      const availableWidth = Math.min(previewStage.clientWidth, 420);
      const scale = availableWidth / 1080;

      captureCanvas.style.transform = `scale(${scale})`;
      previewScaleWrapper.style.width = `${Math.round(1080 * scale)}px`;
      previewScaleWrapper.style.height = `${Math.round(1920 * scale)}px`;
    }

    window.addEventListener('resize', updatePreviewScale);

    downloadBtn.addEventListener('click', async () => {
      if (selectedSongs.length === 0) {
        showStatusMessage('Tambahkan minimal 1 lagu (disarankan 5–10 lagu) sebelum download.', 'warning');
        return;
      }

      if (selectedSongs.length < MIN_RECOMMENDED_SONGS) {
        showStatusMessage(`Tips: Playlist terlihat makin pas dengan ${MIN_RECOMMENDED_SONGS}–${MAX_SONGS} lagu! Tetap mengunduh...`, 'info');
      }

      downloadBtn.disabled = true;
      downloadBtn.classList.add('opacity-75', 'cursor-wait');
      downloadBtnText.textContent = 'Memproses Gambar HD...';

      try {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }

        const dataUrl = await modernScreenshot.domToPng(captureCanvas, {
          width: 1080,
          height: 1920,
          scale: 1.5,
          backgroundColor: '#0E0E15',
          style: {
            transform: 'none',
            transformOrigin: 'top left',
            width: '1080px',
            height: '1920px'
          }
        });

        const link = document.createElement('a');
        link.download = `winamp-wrapped-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showStatusMessage('Gambar Winamp Wrapped HD berhasil diunduh!', 'info');
      } catch (error) {
        console.error('Gagal membuat gambar:', error);
        showStatusMessage('Terjadi kendala saat membuat gambar. Silakan coba lagi.', 'error');
      } finally {
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('opacity-75', 'cursor-wait');
        downloadBtnText.textContent = 'Download Gambar';
      }
    });

    initStaticSpectrumAnalyzer();
    initStaticEqualizer();
    renderAll();
    updatePreviewScale();