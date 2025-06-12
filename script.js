/* ========================================
   GLOBAL STATE MANAGEMENT
   ======================================== */

// Global audio management - CENTRALIZED SYSTEM
// These variables maintain the state of the main radio player
let currentMainAudio = null;        // Currently playing audio element
let isMainRadioPlaying = false;     // Main radio playback state
let audioContextInitialized = false; // Tracks if user has interacted for audio permission

// Progress bar variables
let progressInterval;               // Interval for updating progress bar

/* ========================================
   STATION DATABASE
   ======================================== */

// Enhanced station database with audio files
// Each station contains metadata and audio file path
const stations = [
    {
        freq: '88.5 FM',                    // Display frequency
        name: 'Salem - On Air',             // Station name
        track: 'Leadership & Love',         // Current track title
        artist: "Voices from Zayed's Legacy", // Artist name
        album: 'Salem - On Air • 2025',     // Album information
        genre: 'Leadership',                // Music genre
        signal: 'strong',                   // Signal strength indicator
        mode: 'STEREO',                     // Broadcasting mode
        spectrumPattern: 'smooth',          // Visual spectrum pattern type
        audioFile: 'audio/salem.mp3'       // Path to audio file
    },
    {
        freq: '92.3 FM',
        name: 'Verses Reimagined',
        track: 'Beyond the Self',
        artist: 'Verses Reimagined',
        album: 'Echoes of Iqbal • 2025',
        genre: 'Verses',
        signal: 'strong',
        mode: 'STEREO',
        spectrumPattern: 'wave',
        audioFile: 'audio/iqra.mp3'
    },
    {
        freq: '97.8 FM',
        name: 'Radio Cairo',
        track: "Waiting for Love",
        artist: 'Love Songs',
        album: 'Cairo Radio • 2025',
        genre: 'Classic Rock',
        signal: 'medium',
        mode: 'STEREO',
        spectrumPattern: 'aggressive',
        audioFile: 'audio/abdelrahmank.mp3'
    },
    {
        freq: '101.5 FM',
        name: 'Radio Istanbul Nights',
        track: 'Your Heart\'s Choice',
        artist: 'The Love Collective',
        album: 'Words of Mevlana • 2025',
        genre: 'Heartfelt',
        signal: 'strong',
        mode: 'HD STEREO',
        spectrumPattern: 'dynamic',
        audioFile: null // Will be set based on user choice - Love Radio special case
    }
];

/* ========================================
   RADIO STATE VARIABLES
   ======================================== */

let userLoveChoice = null;          // Store the user's choice for Love Radio
let currentStationIndex = 0;        // Currently selected station index
let isScanning = false;             // Auto-scan mode state
let scanInterval;                   // Interval for station scanning
let knobRotation = 0;              // Main tuning knob rotation angle
let homeKnobRotation = 0;          // Track home section knob rotation
let stationOffset = 0;             // Frequency offset for fine tuning

/* ========================================
   PROGRESS BAR MANAGEMENT
   ======================================== */

// Function to update progress bar with real audio data
// This runs continuously during playback to show current position
function updateSongProgress() {
    const progressFill = document.getElementById('songProgressFill');
    const currentTimeEl = document.querySelector('.current-time');
    const totalTimeEl = document.querySelector('.total-time');
    
    if (progressFill) {
        // Check if we have valid audio with duration
        if (currentMainAudio && currentMainAudio.duration) {
            const currentTime = currentMainAudio.currentTime;
            const duration = currentMainAudio.duration;
            
            // Only update if duration is valid (not NaN)
            if (duration && !isNaN(duration)) {
                // Update progress bar width as percentage
                const percentage = (currentTime / duration) * 100;
                progressFill.style.width = percentage + '%';
                
                // Update time display elements
                if (currentTimeEl) {
                    currentTimeEl.textContent = formatTime(currentTime);
                }
                
                if (totalTimeEl) {
                    totalTimeEl.textContent = formatTime(duration);
                }
            }
        } else {
            // Show default state when no audio is loaded
            if (currentTimeEl) {
                currentTimeEl.textContent = '0:00';
            }
            
            if (totalTimeEl) {
                totalTimeEl.textContent = '0:00';
            }
            
            // Reset progress bar to 0% when no audio
            progressFill.style.width = '0%';
        }
    }
}

// Initialize progress bar to clean state
// Called on page load to ensure consistent starting state
function initializeProgressBar() {
    const progressFill = document.getElementById('songProgressFill');
    const currentTimeEl = document.querySelector('.current-time');
    const totalTimeEl = document.querySelector('.total-time');
    
    // Reset all progress elements to default state
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    
    if (currentTimeEl) {
        currentTimeEl.textContent = '0:00';
    }
    
    if (totalTimeEl) {
        totalTimeEl.textContent = '0:00';
    }
    
    console.log('✅ Progress bar initialized to clean state');
}

// Start progress updates
// Begins the interval that continuously updates the progress bar
function startProgressUpdates() {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(updateSongProgress, 100); // Update every 100ms for smooth animation
}

// Stop progress updates  
// Cleans up the progress update interval
function stopProgressUpdates() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

/* ========================================
   CENTRALIZED AUDIO MANAGEMENT FUNCTIONS
   ======================================== */

// CENTRALIZED AUDIO MANAGEMENT FUNCTIONS
// This is the master function that stops ALL audio across the entire application
function stopAllAudioCompletely() {
    console.log('🔇 STOPPING ALL AUDIO COMPLETELY...');
    
    return new Promise((resolve) => {
        // Stop main radio audio
        if (currentMainAudio) {
            currentMainAudio.pause();
            currentMainAudio.currentTime = 0;
            currentMainAudio = null;
            console.log('✅ Stopped main radio audio');
        }
        
        // Stop all HTML audio elements on the page
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // Stop team players specifically
        if (typeof teamPlayers !== 'undefined') {
            teamPlayers.forEach(player => {
                if (player.isPlaying) {
                    pauseTeamPlayer(player);
                }
            });
        }
        
        // Update global state
        isMainRadioPlaying = false;
        updatePlayButtonState(false);
        stopProgressUpdates(); // Stop progress updates when stopping audio
        
        // Give a small delay to ensure all audio is stopped
        setTimeout(() => {
            console.log('✅ All audio stopped completely');
            resolve();
        }, 50);
    });
}

// Safely play station audio with proper error handling and state management
async function playStationAudioSafely(stationIndex) {
    console.log(`🎵 Safely playing station ${stationIndex}`);
    
    // First, stop everything to prevent audio conflicts
    await stopAllAudioCompletely();
    
    const station = stations[stationIndex];
    if (!station) {
        console.error(`❌ No station found for index ${stationIndex}`);
        return;
    }

    // Special handling for Love Radio (station 4 / index 3)
    if (stationIndex === 3) {
        if (!userLoveChoice) {
            console.log('💕 Love Radio selected but no choice made - staying silent');
            return; // Don't play anything until user makes a choice
        }
        
        // Set the correct audio file based on user choice
        station.audioFile = userLoveChoice === 'beingLoved' ? 'audio/naz1.mp3' : 'audio/naz2.mp3';
        station.track = 'Our Choice in Love';
        station.artist = 'Naz – Radio Istanbul Nights';
    }

    if (!station.audioFile) {
        console.error(`❌ No audio file for station ${stationIndex}`);
        return;
    }
    
    console.log(`🎶 Playing: ${station.audioFile} for ${station.name}`);
    
    // Create fresh audio element for clean state
    const audio = new Audio(station.audioFile);
    audio.volume = 0.7;           // Set default volume
    audio.preload = 'auto';       // Preload audio for smooth playback

    // Add event listeners for progress bar integration
    audio.addEventListener('loadedmetadata', () => {
        updateSongProgress();
    });

    audio.addEventListener('timeupdate', () => {
        updateSongProgress();
    });

    // Add error handling for failed audio loading
    audio.addEventListener('error', (e) => {
        console.error(`❌ Audio error for ${station.audioFile}:`, e);
        isMainRadioPlaying = false;
        updatePlayButtonState(false);
        stopProgressUpdates();
    });

    // Add ended event listener for graceful completion
    audio.addEventListener('ended', () => {
        console.log(`🔚 Audio ended for ${station.name}`);
        isMainRadioPlaying = false;
        updatePlayButtonState(false);
        currentMainAudio = null;
        stopProgressUpdates();
    });

    // Attempt to play audio with error handling
    try {
        await audio.play();
        console.log(`✅ Successfully playing: ${station.audioFile}`);
        currentMainAudio = audio;
        isMainRadioPlaying = true;
        updatePlayButtonState(true);
        startProgressUpdates(); // Start progress updates when audio starts
    } catch (e) {
        console.warn('🔈 Audio play blocked - waiting for user interaction', e);
        isMainRadioPlaying = false;
        updatePlayButtonState(false);
        stopProgressUpdates();
    }
}

// Toggle main radio playback state
// Handles play/pause functionality for the main radio
async function toggleMainRadioPlayback() {
    console.log('🎛️ Toggling main radio playback...');
    console.log('Currently playing:', isMainRadioPlaying);
    console.log('Current station:', currentStationIndex, stations[currentStationIndex]?.name);
    
    if (isMainRadioPlaying) {
        console.log('⏸️ Pausing radio...');
        await stopAllAudioCompletely();
        stopProgressUpdates();
    } else {
        console.log('▶️ Starting radio...');
        await playStationAudioSafely(currentStationIndex);
        startProgressUpdates();
    }
}

// Update play button visual state across the interface
function updatePlayButtonState(playing) {
    const playButton = document.querySelector('.play-button');
    const radioDisplay = document.querySelector('.radio-display');
    
    // Update main play button
    if (playButton) {
        if (playing) {
            playButton.textContent = '⏸';     // Pause icon
            playButton.classList.add('playing');
        } else {
            playButton.textContent = '▶';      // Play icon
            playButton.classList.remove('playing');
        }
    }
    
    // Update radio display visual state
    if (radioDisplay) {
        if (playing) {
            radioDisplay.classList.add('playing');
        } else {
            radioDisplay.classList.remove('playing');
        }
    }
}

/* ========================================
   SPECTRUM VISUALIZATION SYSTEM
   ======================================== */

// Generate enhanced spectrum bars
// Creates the visual frequency spectrum display
function generateSpectrum() {
    const spectrumBars = document.querySelector('.spectrum-bars');
    if (!spectrumBars) return;
    
    const numBars = 150; // Increased number of bars for smoother visualization
    
    // Clear existing bars to prevent duplicates
    spectrumBars.innerHTML = '';
    
    // Create individual spectrum bars
    for (let i = 0; i < numBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'spectrum-bar';
        bar.style.flex = '1';
        spectrumBars.appendChild(bar);
    }
}

// Build base spectrum profile using pseudo-random generation
// Creates a realistic-looking frequency response curve
function buildBaseSpectrum(seed) {
  const rand  = RNG(seed);           // Seeded random number generator
  const bars  = document.querySelectorAll('.spectrum-bar').length;
  let profile = [];
  let h       = 40 + rand()*20;      // Starting height with variation

  // 1) Random-walk to get jagged yet continuous line
  for (let i = 0; i < bars; i++) {
    h += (rand() - 0.5) * 18;        // Add random variation
    h  = Math.max(10, Math.min(90, h)); // Clamp to reasonable bounds
    profile.push(h);
  }

  // 2) One-pass blur → removes "walls" of equal height for more natural look
  profile = profile.map((v, i) => {
    const prev = profile[i-1 < 0 ? 0 : i-1];
    const next = profile[i+1 >= bars ? bars-1 : i+1];
    return (prev + v*2 + next) / 4;   // Simple smoothing algorithm
  });

  return profile;
}

// Animate spectrum bars with live variations
// Creates the illusion of real-time audio visualization
function animateSpectrum() {
  const bars = document.querySelectorAll('.spectrum-bar');
  bars.forEach((bar, i) => {
    // Combine static base height + live jitter + occasional spikes
    let h = baseHeights[i]                    // Base height from profile
          + (Math.random() - 0.5) * 14        // Random jitter
          + (Math.random() < 0.015 ? 40 : 0); // 1.5% chance of spike
    h = Math.max(8, Math.min(92, h));         // Clamp to valid range
    bar.style.height  = h + '%';
    bar.style.opacity = 0.45 + Math.random() * 0.55; // Varying opacity for realism
  });
}

/* ========================================
   STATION SWITCHING AND MANAGEMENT
   ======================================== */

// Enhanced station switching with proper audio management
// Core function for changing radio stations
async function switchToStation(index, withAnimation = true) {
    if (index < 0 || index >= stations.length) return;

    console.log(`🔄 Switching to station ${index}`);

    // Always stop all audio first to prevent conflicts
    await stopAllAudioCompletely();

    const station = stations[index];

    // Update display immediately for responsive UI
    const updateDisplay = () => {
        updateStationDisplay(station, index);
        baseHeights = buildBaseSpectrum(index + 1); // Generate new spectrum pattern
        animateSpectrum();
    };

    // Apply transition animation if requested
    if (withAnimation) {
        const radioInfo = document.querySelector('.radio-info');
        const stationInfo = document.querySelector('.station-info');
        if (radioInfo) radioInfo.classList.add('station-changing');
        if (stationInfo) stationInfo.classList.add('station-changing');
        
        setTimeout(async () => {
            updateDisplay();
            
            // Only play audio if it's not Love Radio without a choice
            if (index !== 3 || userLoveChoice) {
                await playStationAudioSafely(index);
            }
            
            // Remove animation classes after transition
            if (radioInfo) radioInfo.classList.remove('station-changing');
            if (stationInfo) stationInfo.classList.remove('station-changing');
        }, 250);
    } else {
        // Immediate update without animation
        updateDisplay();
        
        // Only play audio if it's not Love Radio without a choice
        if (index !== 3 || userLoveChoice) {
            await playStationAudioSafely(index);
        }
    }
}

// Update knob position based on station selection
// Visual feedback for tuning knob rotation
function updateStationKnobPosition(stationIndex) {
    // Each station is 90 degrees apart (0°, 90°, 180°, 270°)
    homeKnobRotation = stationIndex * 90;
    
    const homeTuningKnob = document.getElementById('homeTuningKnob');
    if (homeTuningKnob) {
        const knobInner = homeTuningKnob.querySelector('.knob-inner');
        if (knobInner) {
            knobInner.style.transform = `rotate(${homeKnobRotation}deg)`;
        }
    }
}

// Update all station display elements with new information
function updateStationDisplay(station, index) {
    // Update frequency and station info in top display
    const frequencyEl = document.querySelector('.frequency');
    const stationNameEl = document.querySelector('.station-name');
    const nowPlayingEl = document.querySelector('.now-playing');
    
    if (frequencyEl) frequencyEl.textContent = station.freq;
    if (stationNameEl) stationNameEl.textContent = station.name;
    if (nowPlayingEl) nowPlayingEl.textContent = `♪ Now Playing: ${station.track} ♪`;
    
    // Update track info panel
    const trackTitleEl = document.querySelector('.track-title');
    const artistNameEl = document.querySelector('.artist-name');
    const albumNameEl = document.querySelector('.album-name');
    
    if (trackTitleEl) trackTitleEl.textContent = station.track;
    if (artistNameEl) artistNameEl.textContent = station.artist;
    if (albumNameEl) albumNameEl.textContent = station.album;
    
    // Update radio stats display
    const freqStatEl = document.querySelector('.radio-stats .stat-line:nth-child(1) .stat-value');
    const modeStatEl = document.querySelector('.radio-stats .stat-line:nth-child(2) .stat-value');
    
    if (freqStatEl) freqStatEl.textContent = station.freq.replace(' FM', ' MHz');
    if (modeStatEl) modeStatEl.textContent = station.mode;
    
    // Update signal strength visualization
    updateSignalStrength(station.signal);
    
    // Update current station index for global state
    currentStationIndex = index;
    
    // Update knob position and spectrum indicator
    knobRotation = (index / (stations.length - 1)) * 270;
    updateKnobRotation(knobRotation);
    
    // Ensure spectrum indicator is updated with small delay for proper layout calculation
    setTimeout(() => {
        updateSpectrumIndicator();
    }, 50);
    updateActivePreset(index);
}

// Update signal strength bars based on station quality
function updateSignalStrength(strength) {
    const bars = document.querySelectorAll('.signal-bar');
    bars.forEach((bar, index) => {
        // Remove existing strength classes
        bar.classList.remove('weak', 'medium', 'strong');
        
        // Apply appropriate strength class based on signal quality
        if (strength === 'strong') {
            bar.classList.add('strong');
        } else if (strength === 'medium' && index < 3) {
            bar.classList.add('medium');
        } else if (strength === 'weak' && index < 2) {
            bar.classList.add('weak');
        }
    });
}

/* ========================================
   KNOB ROTATION AND TUNING CONTROLS
   ======================================== */

// Enhanced tuning knob functionality
// Updates the visual rotation of the tuning knob
function updateKnobRotation(angle) {
    const knobIndicator = document.querySelector('.knob-indicator');
    const knobInner = document.querySelector('.knob-inner');
    
    // Instead of rotating just the indicator, rotate the entire inner knob
    // This makes the pointer and orange center rotate together as one unit
    if (knobInner) {
        knobInner.style.transform = `rotate(${angle}deg)`;
    }
    
    // Update spectrum tuning indicator position based on current frequency
    updateSpectrumIndicator();
}

// Separate function for home tuning knob rotation
// Handles the main interface tuning knob with smooth animation
function updateHomeTuningKnob() {
    const homeTuningKnob = document.getElementById('homeTuningKnob');
    if (homeTuningKnob) {
        homeKnobRotation += 90; // Rotate 90 degrees for each station (more realistic)
        
        // Rotate the inner knob element, not the container
        const knobInner = homeTuningKnob.querySelector('.knob-inner');
        if (knobInner) {
            knobInner.style.transform = `rotate(${homeKnobRotation}deg)`;
            knobInner.style.transition = 'transform 0.3s ease';
            // Remove transition after animation completes
            setTimeout(() => {
                knobInner.style.transition = '';
            }, 300);
        }
    }
}

/* ========================================
   SPECTRUM INDICATOR POSITIONING
   ======================================== */

// Update spectrum indicator position based on current frequency
// Calculates and sets the precise position of the tuning indicator
function updateSpectrumIndicator() {
    const currentStation = stations[currentStationIndex];
    const currentFreq = parseFloat(currentStation.freq.replace(' FM', ''));
    
    // Frequency range exactly matching the spectrum header markers
    const minFreq = 88.1;   // Leftmost marker
    const maxFreq = 107.9;  // Rightmost marker
    
    // Calculate position accounting for the spectrum container's padding
    const basePosition = ((currentFreq - minFreq) / (maxFreq - minFreq)) * 100;
    
    // Account for spectrum padding (10px on each side) and the actual usable width
    const spectrumContainer = document.querySelector('.spectrum');
    if (spectrumContainer) {
        const containerWidth = spectrumContainer.offsetWidth;
        const paddingWidth = 20; // 10px left + 10px right padding from spectrum-bars
        const usableWidth = containerWidth - paddingWidth;
        const paddingOffset = (10 / containerWidth) * 100; // Convert left padding to percentage
        
        // Calculate final position within the padded area
        const adjustedPosition = paddingOffset + (basePosition * (usableWidth / containerWidth));
        
        // Debug logging for tuning accuracy
        console.log(`=== TUNING UPDATE ===`);
        console.log(`Current Station: ${currentStation.name}`);
        console.log(`Frequency: ${currentFreq} MHz`);
        console.log(`Base Position: ${basePosition.toFixed(2)}%`);
        console.log(`Adjusted Position: ${adjustedPosition.toFixed(2)}%`);
        console.log(`Container Width: ${containerWidth}px, Usable Width: ${usableWidth}px`);
        
        const tuningIndicator = document.querySelector('.tuning-indicator');
        if (tuningIndicator) {
            tuningIndicator.style.left = `${adjustedPosition}%`;
            
            // Force a visual update with opacity animation
            tuningIndicator.style.opacity = '0.8';
            setTimeout(() => {
                tuningIndicator.style.opacity = '1';
            }, 100);
        } else {
            console.log('ERROR: Tuning indicator element not found!');
        }
    }
}

// Update visual state of preset buttons
function updateActivePreset(index) {
    document.querySelectorAll('.preset-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
}

/* ========================================
   SCANNING FUNCTIONALITY
   ======================================== */

// Enhanced scanning functionality
// Automatically cycles through all available stations
function startScanning() {
    if (isScanning) return;
    
    isScanning = true;
    const scanBtn = document.querySelector('.scan-btn');
    if (scanBtn) {
        scanBtn.textContent = '⏹ STOP';
        scanBtn.classList.add('active');
    }
    
    let scanIndex = 0;
    scanInterval = setInterval(async () => {
        await switchToStation(scanIndex, true);
        updateActivePreset(scanIndex);
        scanIndex = (scanIndex + 1) % stations.length; // Cycle through all stations
    }, 2000); // Switch every 2 seconds
}

// Stop the automatic scanning process
function stopScanning() {
    if (!isScanning) return;
    
    isScanning = false;
    clearInterval(scanInterval);
    
    const scanBtn = document.querySelector('.scan-btn');
    if (scanBtn) {
        scanBtn.textContent = '🔍 SCAN';
        scanBtn.classList.remove('active');
    }
}

/* ========================================
   RADIO INITIALIZATION
   ======================================== */

// Initialize radio system
// Sets up the radio interface and starts all visual systems
function initializeRadio() {
    console.log('🎛️ Initializing radio...');
    
    // Generate spectrum visualization
    generateSpectrum();
    baseHeights = buildBaseSpectrum(currentStationIndex + 1);
    switchToStation(currentStationIndex, false);
    updateActivePreset(currentStationIndex);
    
    // Initialize home knob rotation to match current station
    homeKnobRotation = currentStationIndex * 45;
    const homeTuningKnob = document.getElementById('homeTuningKnob');
    if (homeTuningKnob) {
        homeTuningKnob.style.transform = `rotate(${homeKnobRotation}deg)`;
    }
    
    // Start continuous spectrum animation for visual appeal
    setInterval(animateSpectrum, 100);
    
    // Initialize spectrum indicator with slight delay for proper rendering
    setTimeout(() => {
        updateSpectrumIndicator();
    }, 100);

    console.log('✅ Radio initialization complete!');
}

/* ========================================
   LOVE RADIO (IDEATION SECTION) FUNCTIONALITY
   ======================================== */

// JavaScript for the Ideation Section (Love Radio)
// This section handles the interactive love-themed radio in the ideation area
const tuningKnob = document.getElementById('tuningKnob');
const volumeKnob = document.getElementById('volumeKnob');
const introText = document.getElementById('introText');
const cardsContainer = document.getElementById('cardsContainer');
const radioWaves = document.getElementById('radioWaves');
const infoDisplay = document.getElementById('infoDisplay');
const volumeIndicator = document.getElementById('volumeIndicator');
const storyCards = document.querySelectorAll('.card[data-frequency]');
const signalBars = document.querySelectorAll('.signal-bar');
const volumeBars = document.querySelectorAll('.volume-bar');

// Love Radio state variables
let currentFreq = 88.7;             // Current frequency for Love Radio
let currentRotation = 0;            // Knob rotation angle
let volumeRotation = 0;             // Volume knob rotation
let volumeLevel = 3;                // Current volume level (0-5)
let isActive = false;               // Whether Love Radio is active
let currentAudio = null;            // Current audio element (disabled in Love Radio)
let isPlaying = false;              // Playing state (disabled in Love Radio)
let stationBase  = 0;               // Base station for frequency calculation
let stationScale = 1;               // Scale factor for frequency

// Spectrum "engine" globals
let baseHeights = [];               // Base heights for spectrum visualization

/* ========================================
   LOVE RADIO UTILITY FUNCTIONS
   ======================================== */

// Tiny, reproducible PRNG (Linear Congruential Generator)
// Used for consistent spectrum generation based on seed
function RNG(seed) {
  let s = seed * 16807 % 2147483647;
  return function() {
    s = s * 16807 % 2147483647;
    return (s & 0x7fffffff) / 2147483647;
  };
}

// Available frequencies for Love Radio tuning
const frequencies = [88.1, 88.3, 88.5, 88.7, 88.9, 89.1];

// Story data for each Love Radio frequency
const storyData = {
    88.1: { title: "Romantic Love", subtitle: '"Two hearts, one rhythm"' },
    88.3: { title: "Divine Love", subtitle: '"Faith that moves mountains"' },
    88.5: { title: "Love in Leadership", subtitle: '"Leading with the heart"' },
    88.7: { title: "Family Bonds", subtitle: '"Love that roots us"' },
    88.9: { title: "Self-Love", subtitle: '"The journey within"' },
    89.1: { title: "Universal Love", subtitle: '"Love without boundaries"' }
};

/* ========================================
   LOVE RADIO DISPLAY FUNCTIONS
   ======================================== */

// Update display function with radio effects
// Updates the Love Radio display based on selected frequency
function updateDisplay(freq) {
    const story = storyData[freq];
    if (infoDisplay) {
        infoDisplay.innerHTML = `
            <div class="frequency-header">
                <span class="frequency-badge-display">FM ${freq}</span>
                <span class="now-playing">NOW PLAYING</span>
            </div>
            <div class="story-title">${story.title}</div>
            <div class="story-subtitle">${story.subtitle}</div>
        `;
    }

    // Update signal strength based on frequency
    updateSignalStrength(freq);
    
    // Switch audio source (disabled for Love Radio)
    switchAudioSource(freq);
    
    // Update spectrum indicator for Love Radio section
    updateLoveRadioSpectrum(freq);
}

// Update Love Radio spectrum with proper positioning  
// Synchronizes the main spectrum indicator with Love Radio frequency
function updateLoveRadioSpectrum(freq) {
    // Update the main radio spectrum indicator to show where we are
    const mainTuningIndicator = document.querySelector('.tuning-indicator');
    if (mainTuningIndicator) {
        // Use exact frequency positioning for all frequencies
        const minFreq = 88.1;
        const maxFreq = 107.9;
        const basePosition = ((freq - minFreq) / (maxFreq - minFreq)) * 100;
        
        // Account for spectrum padding (same as main function)
        const spectrumContainer = document.querySelector('.spectrum');
        if (spectrumContainer) {
            const containerWidth = spectrumContainer.offsetWidth;
            const paddingWidth = 20; // 10px left + 10px right padding
            const usableWidth = containerWidth - paddingWidth;
            const paddingOffset = (10 / containerWidth) * 100;
            
            const adjustedPosition = paddingOffset + (basePosition * (usableWidth / containerWidth));
            
            console.log(`Love Radio: Setting frequency ${freq} MHz to position ${adjustedPosition.toFixed(1)}%`);
            
            mainTuningIndicator.style.left = `${adjustedPosition}%`;
        } else {
            // Fallback to basic positioning if container measurement fails
            mainTuningIndicator.style.left = `${basePosition}%`;
        }
    }
}

// Add audio switching function (DISABLED - No audio in Love Radio section)
// Audio functionality is intentionally disabled in the Love Radio section
function switchAudioSource(freq) {
    // Disabled - No audio playback in Love Radio section
    console.log(`🔇 Love Radio: Audio disabled for frequency ${freq}`);
    return;
}

// Add play/pause functionality (DISABLED)
// Playback controls are disabled in Love Radio for preview-only experience
function togglePlayback() {
    // Disabled - No audio playback in Love Radio section
    console.log('🔇 Love Radio: Playback disabled');
    return;
}

// Update playing state (always shows as paused since no audio plays)
function updatePlayingState() {
    const radio = document.getElementById('radio');
    const nowPlayingElement = document.querySelector('.now-playing');
    
    // Always show as "paused" since no audio plays
    if (radio) radio.classList.remove('playing');
    if (nowPlayingElement) nowPlayingElement.textContent = 'PREVIEW MODE';
    if (radioWaves) radioWaves.style.opacity = '0.3';
}

/* ========================================
   LOVE RADIO SIGNAL AND VOLUME MANAGEMENT
   ======================================== */

// Update signal strength indicator
// Simulates realistic signal strength for the selected frequency
function updateSignalStrength(freq) {
    const strength = Math.floor(Math.random() * 2) + 3; // 3-4 bars for good reception
    signalBars.forEach((bar, index) => {
        if (index < strength) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });
}

// Update volume indicator
// Shows visual feedback for volume changes
function updateVolumeIndicator() {
    volumeBars.forEach((bar, index) => {
        if (index < volumeLevel) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });

    // Show volume indicator temporarily
    if (volumeIndicator) {
        volumeIndicator.style.opacity = '1';
        setTimeout(() => {
            volumeIndicator.style.opacity = '0';
        }, 2000);
    }
}

// Start Love Radio interface
// Activates the Love Radio section with visual transitions
function startRadio() {
    isActive = true;

    // Fade transitions with radio startup effect
    if (introText) {
        introText.style.opacity = '0';
        setTimeout(() => {
            introText.style.display = 'none';
        }, 1000);
    }
    
    if (cardsContainer) cardsContainer.style.opacity = '1';
    if (radioWaves) radioWaves.style.opacity = '0.3'; // Keep waves subtle

    // Initialize display and highlight (NO AUDIO)
    updateDisplay(currentFreq);
    highlightStory(currentFreq);
    updateVolumeIndicator();

    // NO audio initialization - visual only
    console.log('🔇 Love Radio: Started in visual-only mode');

    // Simulate radio warmup
    setTimeout(() => {
        updateSignalStrength(currentFreq);
    }, 500);
}

/* ========================================
   LOVE RADIO INTERACTION HANDLERS
   ======================================== */

// Enhanced tuning knob interaction (AUDIO DISABLED)
// Handles clicking on the Love Radio tuning knob
if (tuningKnob) {
    tuningKnob.addEventListener('click', function() {
        if (!isActive) startRadio();

        // Cycle through available frequencies
        const currentIndex = frequencies.indexOf(currentFreq);
        const nextIndex = (currentIndex + 1) % frequencies.length;
        currentFreq = frequencies[nextIndex];

        // Update knob rotation (60 degrees per step)
        currentRotation += 60;
        this.style.transform = `rotate(${currentRotation}deg)`;

        // Brief static before new station (visual only)
        setTimeout(() => {
            updateDisplay(currentFreq);
            highlightStory(currentFreq);
        }, 150);
    });

    // Remove double-click audio functionality
    tuningKnob.addEventListener('dblclick', function() {
        console.log('🔇 Love Radio: Double-click disabled (no audio)');
    });
}

// Enhanced volume knob interaction (AUDIO DISABLED)
// Handles clicking on the Love Radio volume knob
if (volumeKnob) {
    volumeKnob.addEventListener('click', function() {
        volumeRotation += 45;
        this.style.transform = `rotate(${volumeRotation}deg)`;

        // First click starts radio (visual only)
        if (!isActive) {
            startRadio();
        } else {
            // Cycle volume level (visual only)
            volumeLevel = (volumeLevel + 1) % 6;
        }

        // Update visual indicators only
        updateVolumeIndicator();

        // Adjust radio waves opacity based on volume
        const waveOpacity = Math.min(volumeLevel * 0.1, 0.3); // Keep subtle
        if (radioWaves) radioWaves.style.opacity = Math.max(waveOpacity, 0.1);

        // Visual feedback
        this.style.boxShadow = '0 0 15px rgba(255, 107, 53, 0.8)';
        setTimeout(() => {
            this.style.boxShadow = '';
        }, 200);
        
        console.log('🔇 Love Radio: Volume changed (visual only)');
    });
}

// Highlight the currently selected story card
function highlightStory(freq) {
    storyCards.forEach(card => {
        const cardFreq = parseFloat(card.dataset.frequency);
        if (cardFreq === freq) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

/* ========================================
   LOVE RADIO CARD INTERACTIONS
   ======================================== */

// Enhanced story card interactions (AUDIO DISABLED)
// Handles clicking on story cards to tune to that frequency
storyCards.forEach(card => {
    card.addEventListener('click', function() {
        if (!isActive) startRadio();

        const freq = parseFloat(this.dataset.frequency);
        if (freq !== currentFreq) {
            currentFreq = freq;
            const index = frequencies.indexOf(freq);
            currentRotation = index * 60; // Calculate rotation based on frequency index
            if (tuningKnob) tuningKnob.style.transform = `rotate(${currentRotation}deg)`;

            // Simulate tuning delay (visual only)
            setTimeout(() => {
                updateDisplay(currentFreq);
                highlightStory(currentFreq);
            }, 150);
        }
        // Remove audio toggle functionality
        console.log('🔇 Love Radio: Card interaction (visual only)');
    });

    // Add hover effect for cards
    card.addEventListener('mouseenter', function() {
        if (!this.classList.contains('active')) {
            this.style.transform = 'translateY(-4px) scale(1.01)';
        }
    });

    card.addEventListener('mouseleave', function() {
        if (!this.classList.contains('active')) {
            this.style.transform = '';
        }
    });
});

/* ========================================
   LOVE RADIO BACKGROUND EFFECTS
   ======================================== */

// Simulate occasional signal fluctuation
// Adds realism by randomly updating signal strength
setInterval(() => {
    if (isActive && Math.random() < 0.1) {
        updateSignalStrength(currentFreq);
    }
}, 3000);

/* ========================================
   LOVE RADIO KEYBOARD CONTROLS
   ======================================== */

// Add keyboard controls for radio
// Enables keyboard navigation for Love Radio
document.addEventListener('keydown', function(e) {
    if (!isActive) return;

    switch(e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
            // Tune forward
            if (tuningKnob) tuningKnob.click();
            break;
        case 'ArrowDown':
        case 'ArrowLeft':
            // Tune backwards
            const currentIndex = frequencies.indexOf(currentFreq);
            const prevIndex = currentIndex === 0 ? frequencies.length - 1 : currentIndex - 1;
            currentFreq = frequencies[prevIndex];
            currentRotation -= 60;
            if (tuningKnob) tuningKnob.style.transform = `rotate(${currentRotation}deg)`;
            setTimeout(() => {
                updateDisplay(currentFreq);
                highlightStory(currentFreq);
            }, 150);
            break;
        case ' ': // Spacebar
            e.preventDefault();
            if (volumeKnob) volumeKnob.click();
            break;
    }
});

/* ========================================
   TEAM SECTION PLAYER MANAGEMENT
   ======================================== */

// Team Section Player Management
// Map to store all team player instances
const teamPlayers = new Map();

// Initialize team players
// Sets up each music player in the team section
document.querySelectorAll('#team .music-player').forEach(playerEl => {
    const playerId = playerEl.dataset.player;
    
    // Create player object with all necessary references
    const player = {
        element: playerEl,                                        // Main player container
        isPlaying: false,                                        // Current playing state
        audio: playerEl.querySelector('audio'),                  // Audio element
        currentTime: 0,                                         // Current playback time
        duration: 0,                                            // Total audio duration
        
        // UI Elements
        playBtn: playerEl.querySelector('.play-btn'),           // Play/pause button
        playIcon: playerEl.querySelector('.play-icon'),         // Play icon
        pauseIcon: playerEl.querySelector('.pause-icon'),       // Pause icon
        progressBar: playerEl.querySelector('.progress-bar'),   // Progress bar container
        progressFill: playerEl.querySelector('.progress-fill'), // Progress fill element
        currentTimeEl: playerEl.querySelector('.current-time'), // Current time display
        totalTimeEl: playerEl.querySelector('.total-time'),     // Total time display
        prevBtn: playerEl.querySelector('.prev-btn'),           // Previous track button
        nextBtn: playerEl.querySelector('.next-btn')            // Next track button
    };

    // Listen for loadedmetadata to get actual duration
    if (player.audio) {
        player.audio.addEventListener('loadedmetadata', () => {
            player.duration = player.audio.duration;
            updateTimeDisplay(player);
            console.log(`Player ${playerId}: Loaded metadata. Duration: ${player.duration}`);
        });

        // Listen for timeupdate to update progress bar
        player.audio.addEventListener('timeupdate', () => {
            player.currentTime = player.audio.currentTime;
            updateProgressBar(player);
            updateTimeDisplay(player);
        });

        // Listen for audio ending
        player.audio.addEventListener('ended', () => {
            pauseTeamPlayer(player);
            player.currentTime = 0;
            updateProgressBar(player);
            updateTimeDisplay(player);
            console.log(`Player ${playerId}: Audio ended.`);
        });

        // Add error listener for audio element
        player.audio.addEventListener('error', (e) => {
            console.error(`Player ${playerId}: Audio error!`, e);
        });
    }

    // Store player in global map and set up event handlers
    teamPlayers.set(playerId, player);
    setupTeamPlayerEvents(player, playerId);
    updateTimeDisplay(player);
});

/* ========================================
   TEAM PLAYER EVENT HANDLERS
   ======================================== */

// Set up event handlers for team player controls
function setupTeamPlayerEvents(player, playerId) {
    // Play/Pause button handler
    if (player.playBtn) {
        player.playBtn.addEventListener('click', async () => {
            // Check if THIS player is currently playing before stopping everything
            const wasPlaying = player.isPlaying;
            
            // Stop main radio first to avoid conflicts
            await stopAllAudioCompletely();
            
            // Pause all other team players
            teamPlayers.forEach((otherPlayer, otherId) => {
                if (otherId !== playerId && otherPlayer.isPlaying) {
                    pauseTeamPlayer(otherPlayer);
                }
            });

            // Now use the original state to decide what to do
            if (wasPlaying) {
                // Player was playing, so keep it paused (don't restart)
                pauseTeamPlayer(player);
            } else {
                // Player was not playing, so start it
                playTeamPlayer(player);
            }
        });
    }

    // Previous track button handler
    if (player.prevBtn) {
        player.prevBtn.addEventListener('click', () => {
            console.log(`Player ${playerId}: Previous button clicked`);
            // Stop current player
            if (player.isPlaying) {
                pauseTeamPlayer(player);
            }

            // Find and start previous player
            const currentId = parseInt(playerId);
            const prevIndex = (currentId - 1 - 1 + teamPlayers.size) % teamPlayers.size; // 0-based index
            const prevId = (prevIndex + 1).toString(); // 1-based ID
            console.log(`Player ${playerId}: Calculated previous player ID: ${prevId}`);
            const prevPlayer = teamPlayers.get(prevId);
            
            if (prevPlayer) {
                console.log(`Player ${playerId}: Found previous player: ${prevId}`);
                // Add pop animation for visual feedback
                prevPlayer.element.classList.add('pop-animation');
                
                // Remove animation after it completes
                setTimeout(() => {
                    prevPlayer.element.classList.remove('pop-animation');
                }, 600);
                
                // Start playing the previous player after a short delay
                setTimeout(() => {
                    prevPlayer.currentTime = 0; // Reset current time for the new track
                    playTeamPlayer(prevPlayer);
                }, 200);
            } else {
                console.log(`Player ${playerId}: Previous player ${prevId} not found.`);
            }
        });
    }

    // Next track button handler
    if (player.nextBtn) {
        player.nextBtn.addEventListener('click', () => {
            console.log(`Player ${playerId}: Next button clicked`);
            // Stop current player
            if (player.isPlaying) {
                pauseTeamPlayer(player);
            }

            // Find and start next player
            const currentId = parseInt(playerId);
            const nextId = ((currentId % teamPlayers.size) + 1).toString(); // Corrected logic for cycling through players
            console.log(`Player ${playerId}: Calculated next player ID: ${nextId}`);
            const nextPlayer = teamPlayers.get(nextId);
            
            if (nextPlayer) {
                console.log(`Player ${playerId}: Found next player: ${nextId}`);
                // Add pop animation for visual feedback
                nextPlayer.element.classList.add('pop-animation');
                
                // Remove animation after it completes
                setTimeout(() => {
                    nextPlayer.element.classList.remove('pop-animation');
                }, 600);
                
                // Start playing the next player after a short delay
                setTimeout(() => {
                    nextPlayer.currentTime = 0; // Reset current time for the new track
                    playTeamPlayer(nextPlayer);
                }, 200);
            } else {
                console.log(`Player ${playerId}: Next player ${nextId} not found.`);
            }
        });
    }

    // Progress bar click handler for scrubbing
    if (player.progressBar) {
        player.progressBar.addEventListener('click', (e) => {
            const rect = player.progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * player.duration;
            
            // Smoothly update the progress bar
            player.progressFill.style.transition = 'width 0.1s linear';
            player.currentTime = newTime;
            if (player.audio) player.audio.currentTime = newTime;
            updateProgressBar(player);
            updateTimeDisplay(player);
        });

        // Add touch support for mobile devices
        player.progressBar.addEventListener('touchstart', handleTouch);
        player.progressBar.addEventListener('touchmove', handleTouch);
        
        function handleTouch(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = player.progressBar.getBoundingClientRect();
            const clickX = touch.clientX - rect.left;
            const newTime = (clickX / rect.width) * player.duration;
            
            player.progressFill.style.transition = 'width 0.1s linear';
            player.currentTime = newTime;
            if (player.audio) player.audio.currentTime = newTime;
            updateProgressBar(player);
            updateTimeDisplay(player);
        }
    }
}

/* ========================================
   TEAM PLAYER CONTROL FUNCTIONS
   ======================================== */

// Start playing a team player
function playTeamPlayer(player) {
    player.isPlaying = true;
    player.element.classList.add('playing');
    console.log(`Player ${player.element.dataset.player}: playTeamPlayer called, isPlaying: ${player.isPlaying}`);
    updatePlayButton(player);
    if (player.audio) player.audio.play();
}

// Pause a team player
function pauseTeamPlayer(player) {
    player.isPlaying = false;
    player.element.classList.remove('playing');
    console.log(`Player ${player.element.dataset.player}: pauseTeamPlayer called, isPlaying: ${player.isPlaying}`);
    updatePlayButton(player);
    if (player.audio) player.audio.pause();
}

// Update play button visual state
function updatePlayButton(player) {
    console.log(`Player ${player.element.dataset.player}: updatePlayButton called, isPlaying: ${player.isPlaying}`);
    if (player.playBtn) {
        if (player.isPlaying) {
            player.playBtn.textContent = '⏸';
            console.log(`Player ${player.element.dataset.player}: Displaying pause icon`);
        } else {
            player.playBtn.textContent = '▶';
            console.log(`Player ${player.element.dataset.player}: Displaying play icon`);
        }
    }
}

// Update progress bar visual state
function updateProgressBar(player) {
    if (player.duration > 0 && player.progressFill) {
        const progress = (player.currentTime / player.duration) * 100;
        player.progressFill.style.width = `${Math.min(progress, 100)}%`;
        console.log(`Player ${player.element.dataset.player}: Progress bar width set to ${player.progressFill.style.width}`);
    }
}

// Update time display elements
function updateTimeDisplay(player) {
    if (player.currentTimeEl) player.currentTimeEl.textContent = formatTime(player.currentTime);
    if (player.totalTimeEl && player.duration > 0) {
        const remaining = Math.max(0, player.duration - player.currentTime);
        player.totalTimeEl.textContent = '-' + formatTime(remaining);
    }
}

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

// Format time in MM:SS format
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

/* ========================================
   MAIN PROGRESS BAR INTERACTION
   ======================================== */

// Make progress bar interactive
// Adds click and drag functionality to the main radio progress bar
function makeProgressBarInteractive() {
    const progressTrack = document.querySelector('.progress-track');
    
    if (progressTrack) {
        let isDragging = false;
        
        // Click to scrub
        progressTrack.addEventListener('click', handleProgressClick);
        
        // Mouse down to start dragging
        progressTrack.addEventListener('mousedown', (e) => {
            isDragging = true;
            handleProgressClick(e);
            document.addEventListener('mousemove', handleProgressDrag);
            document.addEventListener('mouseup', stopDragging);
            e.preventDefault(); // Prevent text selection
        });
        
        // Touch support for mobile
        progressTrack.addEventListener('touchstart', (e) => {
            isDragging = true;
            handleProgressTouch(e);
            document.addEventListener('touchmove', handleProgressTouchMove);
            document.addEventListener('touchend', stopDragging);
            e.preventDefault();
        });
        
        // Handle progress bar clicks
        function handleProgressClick(e) {
            // Get current station and try to create/access audio if needed
            const station = stations[currentStationIndex];
            if (!station || !station.audioFile) return;
            
            // If no audio exists, create it
            if (!currentMainAudio) {
                // Handle Love Radio special case
                if (currentStationIndex === 3 && userLoveChoice) {
                    station.audioFile = userLoveChoice === 'beingLoved' ? 'audio/naz1.mp3' : 'audio/naz2.mp3';
                }
                
                currentMainAudio = new Audio(station.audioFile);
                currentMainAudio.volume = 0.7;
                currentMainAudio.preload = 'metadata';
                
                // Add event listeners
                currentMainAudio.addEventListener('loadedmetadata', () => {
                    performScrub(e);
                });
                
                currentMainAudio.addEventListener('timeupdate', updateSongProgress);
                currentMainAudio.addEventListener('ended', () => {
                    isMainRadioPlaying = false;
                    updatePlayButtonState(false);
                    stopProgressUpdates();
                });
                
                // Load metadata
                currentMainAudio.load();
                return;
            }
            
            // If audio exists but no duration yet, wait for metadata
            if (!currentMainAudio.duration || isNaN(currentMainAudio.duration)) {
                currentMainAudio.addEventListener('loadedmetadata', () => {
                    performScrub(e);
                }, { once: true });
                return;
            }
            
            performScrub(e);
        }
        
        // Perform the actual scrubbing operation
        function performScrub(e) {
            if (!currentMainAudio || !currentMainAudio.duration) return;
            
            const rect = progressTrack.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, clickX / rect.width));
            const newTime = percentage * currentMainAudio.duration;
            
            // Update audio position
            currentMainAudio.currentTime = newTime;
            
            // If audio was playing, keep it playing
            if (isMainRadioPlaying && currentMainAudio.paused) {
                currentMainAudio.play().catch(e => console.log('Resume play failed:', e));
            }
            
            // Immediate visual feedback
            updateSongProgress();
            
            console.log(`🎯 Scrubbed to: ${formatTime(newTime)} (${isMainRadioPlaying ? 'playing' : 'paused'})`);
        }
        
        // Handle dragging while mouse is down
        function handleProgressDrag(e) {
            if (!isDragging) return;
            handleProgressClick(e);
        }
        
        // Handle touch events for mobile scrubbing
        function handleProgressTouch(e) {
            // Get current station and try to create/access audio if needed
            const station = stations[currentStationIndex];
            if (!station || !station.audioFile) return;
            
            // If no audio exists, create it
            if (!currentMainAudio) {
                // Handle Love Radio special case
                if (currentStationIndex === 3 && userLoveChoice) {
                    station.audioFile = userLoveChoice === 'beingLoved' ? 'audio/naz1.mp3' : 'audio/naz2.mp3';
                }
                
                currentMainAudio = new Audio(station.audioFile);
                currentMainAudio.volume = 0.7;
                currentMainAudio.preload = 'metadata';
                
                // Add event listeners
                currentMainAudio.addEventListener('loadedmetadata', () => {
                    performTouchScrub(e);
                });
                
                currentMainAudio.addEventListener('timeupdate', updateSongProgress);
                currentMainAudio.addEventListener('ended', () => {
                    isMainRadioPlaying = false;
                    updatePlayButtonState(false);
                    stopProgressUpdates();
                });
                
                // Load metadata
                currentMainAudio.load();
                return;
            }
            
            // If audio exists but no duration yet, wait for metadata
            if (!currentMainAudio.duration || isNaN(currentMainAudio.duration)) {
                currentMainAudio.addEventListener('loadedmetadata', () => {
                    performTouchScrub(e);
                }, { once: true });
                return;
            }
            
            performTouchScrub(e);
        }
        
        // Perform touch-based scrubbing
        function performTouchScrub(e) {
            if (!currentMainAudio || !currentMainAudio.duration) return;
            
            const touch = e.touches[0];
            const rect = progressTrack.getBoundingClientRect();
            const clickX = touch.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, clickX / rect.width));
            const newTime = percentage * currentMainAudio.duration;
            
            // Update audio position
            currentMainAudio.currentTime = newTime;
            
            // If audio was playing, keep it playing
            if (isMainRadioPlaying && currentMainAudio.paused) {
                currentMainAudio.play().catch(e => console.log('Resume play failed:', e));
            }
            
            // Immediate visual feedback
            updateSongProgress();
        }
        
        // Handle touch move events
        function handleProgressTouchMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            handleProgressTouch(e);
        }
        
        // Stop dragging operation
        function stopDragging() {
            isDragging = false;
            document.removeEventListener('mousemove', handleProgressDrag);
            document.removeEventListener('mouseup', stopDragging);
            document.removeEventListener('touchmove', handleProgressTouchMove);
            document.removeEventListener('touchend', stopDragging);
        }
        
        // Visual feedback on hover
        progressTrack.addEventListener('mouseenter', () => {
            progressTrack.style.transform = 'scaleY(1.2)';
            progressTrack.style.transition = 'transform 0.2s ease';
        });
        
        progressTrack.addEventListener('mouseleave', () => {
            if (!isDragging) {
                progressTrack.style.transform = 'scaleY(1)';
            }
        });
        
        // Preview time on hover
        progressTrack.addEventListener('mousemove', (e) => {
            if (isDragging) return;
            
            const station = stations[currentStationIndex];
            if (!station || !station.audioFile) return;
            
            // Show preview even without audio loaded
            const rect = progressTrack.getBoundingClientRect();
            const hoverX = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
            
            // If we have audio with duration, show actual time
            if (currentMainAudio && currentMainAudio.duration) {
                const previewTime = percentage * currentMainAudio.duration;
                progressTrack.title = `Skip to: ${formatTime(previewTime)}`;
            } else {
                // Show percentage if no duration available
                const percentText = Math.round(percentage * 100);
                progressTrack.title = `Skip to: ${percentText}%`;
            }
        });
        
        console.log('✅ Progress bar made interactive');
    }
}

/* ========================================
   MAIN EVENT LISTENERS AND INITIALIZATION
   ======================================== */

// Event listeners
// Main initialization and event binding
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing...');
    initializeRadio();
    initializeProgressBar(); // Initialize clean progress bar state
    updateSongProgress(); // Initialize progress display
    makeProgressBarInteractive(); // Make progress bar interactive
    
    // Play button with enhanced audio functionality
    const playButton = document.querySelector('.play-button');
    if (playButton) {
        playButton.addEventListener('click', async function () {
            // Initialize audio context on first interaction
            if (!audioContextInitialized) {
                audioContextInitialized = true;
                if (!isActive) startRadio();
            }

            // Tiny press animation for visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => { this.style.transform = ''; }, 150);

            await toggleMainRadioPlayback();
        });
    }

    // Scan button functionality
    const scanBtn = document.querySelector('.scan-btn');
    if (scanBtn) {
        scanBtn.addEventListener('click', function() {
            if (isScanning) {
                stopScanning();
            } else {
                startScanning();
            }
        });
    }

    // Preset buttons with FIXED AUDIO LOGIC
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            if (!audioContextInitialized) {
                audioContextInitialized = true;
                if (!isActive) startRadio();
            }

            const presetIndex = parseInt(this.dataset.preset, 10);

            // LOVE RADIO (button 4) - SPECIAL HANDLING
            if (this.id === 'preset4') {
                await stopAllAudioCompletely(); // Ensure complete silence
                currentStationIndex = 3; // Set to station 4
                updateActivePreset(3); // Update visual state
                
                // Show modal without any audio
                const loveModal = document.getElementById('loveModal');
                if (loveModal) {
                    loveModal.classList.add('show');
                    const modalContent = loveModal.querySelector('.modal-content');
                    if (modalContent) modalContent.classList.add('pulse');
                }
                return;
            }

            // Regular presets 1-3 - ALWAYS PLAY AUDIO
            currentStationIndex = presetIndex;

            homeKnobRotation = presetIndex * 45;
            const homeTuningKnob = document.getElementById('homeTuningKnob');
            if (homeTuningKnob) {
                homeTuningKnob.style.transform = `rotate(${homeKnobRotation}deg)`;
            }

            await switchToStation(presetIndex);
            stopScanning();
        });
    });

    // Handle love modal choices with PROPER AUDIO MANAGEMENT
    document.querySelectorAll('.choice-btn').forEach(choiceBtn => {
        choiceBtn.addEventListener('click', async function() {
            const answer = this.dataset.answer;
            const loveModal = document.getElementById('loveModal');
            const modalContent = loveModal?.querySelector('.modal-content');
            
            // Store the user's choice
            userLoveChoice = answer;
            console.log(`💕 User chose: ${answer}`);
            
            // Remove pulse animation
            if (modalContent) modalContent.classList.remove('pulse');
            
            // Add selection feedback
            this.style.background = 'linear-gradient(135deg, #ff6b35, #ff8c42)';
            this.style.color = 'white';
            this.style.transform = 'scale(1.05)';
            
            setTimeout(async () => {
                // Hide the modal with animation
                if (loveModal) loveModal.classList.remove('show');
                
                // Now switch to station 4 with audio
                setTimeout(async () => {
                    currentStationIndex = 3;
                    
                    // Update knob rotation to position 4
                    homeKnobRotation = 3 * 45;
                    const homeTuningKnob = document.getElementById('homeTuningKnob');
                    if (homeTuningKnob) {
                        homeTuningKnob.style.transform = `rotate(${homeKnobRotation}deg)`;
                        homeTuningKnob.style.transition = 'transform 0.3s ease';
                        setTimeout(() => {
                            homeTuningKnob.style.transition = '';
                        }, 300);
                    }
                    
                    // Update active preset and switch with audio
                    updateActivePreset(3);
                    await switchToStation(3, true); // This will now play audio because userLoveChoice is set
                    stopScanning();
                }, 400);
                
            }, 800);
        });
    });

    // Tuning knob click with FIXED LOGIC
    const homeTuningKnob = document.getElementById('homeTuningKnob');
    if (homeTuningKnob) {
        homeTuningKnob.addEventListener('click', async function () {
            if (!audioContextInitialized) {
                audioContextInitialized = true;
                if (!isActive) startRadio();
            }

            const nextStationIndex = (currentStationIndex + 1) % stations.length;

            // LOVE RADIO position → show modal instead of playing audio
            if (nextStationIndex === 3) {
                await stopAllAudioCompletely();
                currentStationIndex = nextStationIndex;
                updateHomeTuningKnob();
                updateActivePreset(currentStationIndex);
                
                const loveModal = document.getElementById('loveModal');
                if (loveModal) {
                    loveModal.classList.add('show');
                    const modalContent = loveModal.querySelector('.modal-content');
                    if (modalContent) modalContent.classList.add('pulse');
                }
                return;
            }

            // Normal tuning with audio
            currentStationIndex = nextStationIndex;
            updateHomeTuningKnob();
            await switchToStation(currentStationIndex);
            stopScanning();
        });
    }

    // Navigation buttons with FIXED LOGIC
    const nextBtn = document.querySelector('.next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', async function() {
            const nextStationIndex = (currentStationIndex + 1) % stations.length;
            
            if (nextStationIndex === 3) {
                await stopAllAudioCompletely();
                currentStationIndex = nextStationIndex;
                updateHomeTuningKnob();
                updateActivePreset(currentStationIndex);
                
                const loveModal = document.getElementById('loveModal');
                if (loveModal) {
                    loveModal.classList.add('show');
                    const modalContent = loveModal.querySelector('.modal-content');
                    if (modalContent) modalContent.classList.add('pulse');
                }
                return;
            }
            
            currentStationIndex = nextStationIndex;
            updateHomeTuningKnob();
            await switchToStation(currentStationIndex);
            stopScanning();
        });
    }

    const prevBtn = document.querySelector('.prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', async function() {
            const prevStationIndex = (currentStationIndex - 1 + stations.length) % stations.length;
            
            if (prevStationIndex === 3) {
                await stopAllAudioCompletely();
                currentStationIndex = prevStationIndex;
                homeKnobRotation = prevStationIndex * 45;
                const homeTuningKnob = document.getElementById('homeTuningKnob');
                if (homeTuningKnob) {
                    homeTuningKnob.style.transform = `rotate(${homeKnobRotation}deg)`;
                    homeTuningKnob.style.transition = 'transform 0.3s ease';
                    setTimeout(() => {
                        homeTuningKnob.style.transition = '';
                    }, 300);
                }
                updateActivePreset(currentStationIndex);
                
                const loveModal = document.getElementById('loveModal');
                if (loveModal) {
                    loveModal.classList.add('show');
                    const modalContent = loveModal.querySelector('.modal-content');
                    if (modalContent) modalContent.classList.add('pulse');
                }
                return;
            }
            
            currentStationIndex = prevStationIndex;
            homeKnobRotation -= 45;
            const homeTuningKnob = document.getElementById('homeTuningKnob');
            if (homeTuningKnob) {
                homeTuningKnob.style.transform = `rotate(${homeKnobRotation}deg)`;
                homeTuningKnob.style.transition = 'transform 0.3s ease';
                setTimeout(() => {
                    homeTuningKnob.style.transition = '';
                }, 300);
            }
            await switchToStation(currentStationIndex);
            stopScanning();
        });
    }

    // Radio mode buttons (FM/AM toggle)
    document.querySelectorAll('.radio-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent === 'FM' || this.textContent === 'AM') {
                document.querySelectorAll('.radio-btn').forEach(b => {
                    if (b.textContent === 'FM' || b.textContent === 'AM') {
                        b.classList.remove('active');
                    }
                });
                this.classList.add('active');
            }
        });
    });

    // Volume slider functionality
    const homeVolumeSlider = document.getElementById('homeVolumeSlider');
    if (homeVolumeSlider) {
        homeVolumeSlider.addEventListener('input', function() {
            console.log('Volume:', this.value);
            
            // Update audio volume for currently playing audio
            if (currentMainAudio) {
                currentMainAudio.volume = this.value / 100;
            }
            
            // Add visual feedback for volume changes
            const volumeLabel = document.querySelector('.volume-label');
            if (volumeLabel) {
                volumeLabel.textContent = `VOLUME ${this.value}%`;
                setTimeout(() => {
                    volumeLabel.textContent = 'VOLUME';
                }, 1000);
            }
        });
    }

    // Add smooth scrolling for navigation links
    document.querySelectorAll('.navbar-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});

/* ========================================
   END OF JAVASCRIPT FILE
   ======================================== */