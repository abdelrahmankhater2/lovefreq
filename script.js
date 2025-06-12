// Global audio management - CENTRALIZED SYSTEM
        let currentMainAudio = null;
        let isMainRadioPlaying = false;
        let audioContextInitialized = false;

        // Enhanced station database with audio files
        const stations = [
            {
                freq: '88.5 FM',
                name: 'Salem - On Air',
                track: 'Leadership & Love',
                artist: "Voices from Zayed's Legacy",
                album: 'Salem - On Air • 2025',
                genre: 'Leadership',
                signal: 'strong',
                mode: 'STEREO',
                spectrumPattern: 'smooth',
                audioFile: 'audio/salem.mp3'
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
                audioFile: null // Will be set based on user choice
            }
        ];

        let userLoveChoice = null; // Store the user's choice
        let currentStationIndex = 0;// Start with preset 3 (index 2
        let isScanning = false;
        let scanInterval;
        let knobRotation = 0;
        let homeKnobRotation = 0; // Track home section knob rotation
        let stationOffset = 0; 

        // CENTRALIZED AUDIO MANAGEMENT FUNCTIONS
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
                
                // Stop all HTML audio elements
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
                
                isMainRadioPlaying = false;
                updatePlayButtonState(false);
                
                // Give a small delay to ensure all audio is stopped
                setTimeout(() => {
                    console.log('✅ All audio stopped completely');
                    resolve();
                }, 50);
            });
        }

        async function playStationAudioSafely(stationIndex) {
            console.log(`🎵 Safely playing station ${stationIndex}`);
            
            // First, stop everything
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
            
            // Create fresh audio element
            const audio = new Audio(station.audioFile);
            audio.volume = 0.7;
            audio.preload = 'auto';

            // Add error handling
            audio.addEventListener('error', (e) => {
                console.error(`❌ Audio error for ${station.audioFile}:`, e);
                isMainRadioPlaying = false;
                updatePlayButtonState(false);
            });

            // Add ended event listener
            audio.addEventListener('ended', () => {
                console.log(`🔚 Audio ended for ${station.name}`);
                isMainRadioPlaying = false;
                updatePlayButtonState(false);
                currentMainAudio = null;
            });

            try {
                await audio.play();
                console.log(`✅ Successfully playing: ${station.audioFile}`);
                currentMainAudio = audio;
                isMainRadioPlaying = true;
                updatePlayButtonState(true);
            } catch (e) {
                console.warn('🔈 Audio play blocked - waiting for user interaction', e);
                isMainRadioPlaying = false;
                updatePlayButtonState(false);
            }
        }

        async function toggleMainRadioPlayback() {
            console.log('🎛️ Toggling main radio playback...');
            console.log('Currently playing:', isMainRadioPlaying);
            console.log('Current station:', currentStationIndex, stations[currentStationIndex]?.name);
            
            if (isMainRadioPlaying) {
                console.log('⏸️ Pausing radio...');
                await stopAllAudioCompletely();
            } else {
                console.log('▶️ Starting radio...');
                await playStationAudioSafely(currentStationIndex);
            }
        }

        function updatePlayButtonState(playing) {
            const playButton = document.querySelector('.play-button');
            const radioDisplay = document.querySelector('.radio-display');
            
            if (playButton) {
                if (playing) {
                    playButton.textContent = '⏸';
                    playButton.classList.add('playing');
                } else {
                    playButton.textContent = '▶';
                    playButton.classList.remove('playing');
                }
            }
            
            if (radioDisplay) {
                if (playing) {
                    radioDisplay.classList.add('playing');
                } else {
                    radioDisplay.classList.remove('playing');
                }
            }
        }

        // Generate enhanced spectrum bars
        function generateSpectrum() {
            const spectrumBars = document.querySelector('.spectrum-bars');
            if (!spectrumBars) return;
            
            const numBars = 80;
            
            // Clear existing bars
            spectrumBars.innerHTML = '';
            
            for (let i = 0; i < numBars; i++) {
                const bar = document.createElement('div');
                bar.className = 'spectrum-bar';
                bar.style.flex = '1';
                spectrumBars.appendChild(bar);
            }
        }

        function buildBaseSpectrum(seed) {
          const rand  = RNG(seed);
          const bars  = document.querySelectorAll('.spectrum-bar').length;
          let profile = [];
          let h       = 40 + rand()*20;

          // 1) random-walk to get jagged yet continuous line
          for (let i = 0; i < bars; i++) {
            h += (rand() - 0.5) * 18;
            h  = Math.max(10, Math.min(90, h));
            profile.push(h);
          }

          // 2) one-pass blur → removes "walls" of equal height
          profile = profile.map((v, i) => {
            const prev = profile[i-1 < 0 ? 0 : i-1];
            const next = profile[i+1 >= bars ? bars-1 : i+1];
            return (prev + v*2 + next) / 4;
          });

          return profile;
        }

        function animateSpectrum() {
          const bars = document.querySelectorAll('.spectrum-bar');
          bars.forEach((bar, i) => {
            // static base + live jitter + rare spike
            let h = baseHeights[i]
                  + (Math.random() - 0.5) * 14
                  + (Math.random() < 0.015 ? 40 : 0);
            h = Math.max(8, Math.min(92, h));
            bar.style.height  = h + '%';
            bar.style.opacity = 0.45 + Math.random() * 0.55;
          });
        }

        // Enhanced station switching with proper audio management
        async function switchToStation(index, withAnimation = true) {
            if (index < 0 || index >= stations.length) return;

            console.log(`🔄 Switching to station ${index}`);

            // Always stop all audio first
            await stopAllAudioCompletely();

            const station = stations[index];

            // Update display immediately
            const updateDisplay = () => {
                updateStationDisplay(station, index);
                baseHeights = buildBaseSpectrum(index + 1);
                animateSpectrum();
            };

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
                    
                    if (radioInfo) radioInfo.classList.remove('station-changing');
                    if (stationInfo) stationInfo.classList.remove('station-changing');
                }, 250);
            } else {
                updateDisplay();
                
                // Only play audio if it's not Love Radio without a choice
                if (index !== 3 || userLoveChoice) {
                    await playStationAudioSafely(index);
                }
            }
        }

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

        function updateStationDisplay(station, index) {
            // Update frequency and station info
            const frequencyEl = document.querySelector('.frequency');
            const stationNameEl = document.querySelector('.station-name');
            const nowPlayingEl = document.querySelector('.now-playing');
            
            if (frequencyEl) frequencyEl.textContent = station.freq;
            if (stationNameEl) stationNameEl.textContent = station.name;
            if (nowPlayingEl) nowPlayingEl.textContent = `♪ Now Playing: ${station.track} ♪`;
            
            // Update track info
            const trackTitleEl = document.querySelector('.track-title');
            const artistNameEl = document.querySelector('.artist-name');
            const albumNameEl = document.querySelector('.album-name');
            
            if (trackTitleEl) trackTitleEl.textContent = station.track;
            if (artistNameEl) artistNameEl.textContent = station.artist;
            if (albumNameEl) albumNameEl.textContent = station.album;
            
            // Update radio stats
            const freqStatEl = document.querySelector('.radio-stats .stat-line:nth-child(1) .stat-value');
            const modeStatEl = document.querySelector('.radio-stats .stat-line:nth-child(2) .stat-value');
            
            if (freqStatEl) freqStatEl.textContent = station.freq.replace(' FM', ' MHz');
            if (modeStatEl) modeStatEl.textContent = station.mode;
            
            // Update signal strength
            updateSignalStrength(station.signal);
            
            // Update current station index
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

        function updateSignalStrength(strength) {
            const bars = document.querySelectorAll('.signal-bar');
            bars.forEach((bar, index) => {
                bar.classList.remove('weak', 'medium', 'strong');
                
                if (strength === 'strong') {
                    bar.classList.add('strong');
                } else if (strength === 'medium' && index < 3) {
                    bar.classList.add('medium');
                } else if (strength === 'weak' && index < 2) {
                    bar.classList.add('weak');
                }
            });
        }

        // Enhanced tuning knob functionality
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
function updateHomeTuningKnob() {
    const homeTuningKnob = document.getElementById('homeTuningKnob');
    if (homeTuningKnob) {
        homeKnobRotation += 90; // Rotate 90 degrees for each station (more realistic)
        
        // Rotate the inner knob element, not the container
        const knobInner = homeTuningKnob.querySelector('.knob-inner');
        if (knobInner) {
            knobInner.style.transform = `rotate(${homeKnobRotation}deg)`;
            knobInner.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                knobInner.style.transition = '';
            }, 300);
        }
    }
}

        // Update spectrum indicator position based on current frequency
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
                
                console.log(`=== TUNING UPDATE ===`);
                console.log(`Current Station: ${currentStation.name}`);
                console.log(`Frequency: ${currentFreq} MHz`);
                console.log(`Base Position: ${basePosition.toFixed(2)}%`);
                console.log(`Adjusted Position: ${adjustedPosition.toFixed(2)}%`);
                console.log(`Container Width: ${containerWidth}px, Usable Width: ${usableWidth}px`);
                
                const tuningIndicator = document.querySelector('.tuning-indicator');
                if (tuningIndicator) {
                    tuningIndicator.style.left = `${adjustedPosition}%`;
                    
                    // Force a visual update
                    tuningIndicator.style.opacity = '0.8';
                    setTimeout(() => {
                        tuningIndicator.style.opacity = '1';
                    }, 100);
                } else {
                    console.log('ERROR: Tuning indicator element not found!');
                }
            }
        }

        function updateActivePreset(index) {
            document.querySelectorAll('.preset-btn').forEach((btn, i) => {
                btn.classList.toggle('active', i === index);
            });
        }

        // Enhanced scanning functionality
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
                scanIndex = (scanIndex + 1) % stations.length;
            }, 2000); // Switch every 2 seconds
        }

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

        // Initialize radio
        function initializeRadio() {
            console.log('🎛️ Initializing radio...');
            
            generateSpectrum();
            baseHeights = buildBaseSpectrum(currentStationIndex + 1);
            switchToStation(currentStationIndex, false);
            updateActivePreset(currentStationIndex);
            
            // Initialize home knob rotation
            homeKnobRotation = currentStationIndex * 45;
            const homeTuningKnob = document.getElementById('homeTuningKnob');
            if (homeTuningKnob) {
                homeTuningKnob.style.transform = `rotate(${homeKnobRotation}deg)`;
            }
            
            // add this back for continuous flicker:
            setInterval(animateSpectrum, 100);
            
            // Initialize spectrum indicator
            setTimeout(() => {
                updateSpectrumIndicator();
            }, 100);

            console.log('✅ Radio initialization complete!');
        }

        // JavaScript for the Ideation Section (Love Radio)
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

        let currentFreq = 88.7;
        let currentRotation = 0;
        let volumeRotation = 0;
        let volumeLevel = 3;
        let isActive = false;
        let currentAudio = null;
        let isPlaying = false;
        let stationBase  = 0;
        let stationScale = 1;

        // Spectrum "engine" globals
        let baseHeights = [];

        // tiny, reproducible PRNG (LCG)
        function RNG(seed) {
          let s = seed * 16807 % 2147483647;
          return function() {
            s = s * 16807 % 2147483647;
            return (s & 0x7fffffff) / 2147483647;
          };
        }

        const frequencies = [88.1, 88.3, 88.5, 88.7, 88.9, 89.1];
        const storyData = {
            88.1: { title: "Romantic Love", subtitle: '"Two hearts, one rhythm"' },
            88.3: { title: "Divine Love", subtitle: '"Faith that moves mountains"' },
            88.5: { title: "Love in Leadership", subtitle: '"Leading with the heart"' },
            88.7: { title: "Family Bonds", subtitle: '"Love that roots us"' },
            88.9: { title: "Self-Love", subtitle: '"The journey within"' },
            89.1: { title: "Universal Love", subtitle: '"Love without boundaries"' }
        };

        // Update display function with radio effects
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
            
            // Switch audio source
            switchAudioSource(freq);
            
            // Update spectrum indicator for Love Radio section
            updateLoveRadioSpectrum(freq);
        }

        // Update Love Radio spectrum with proper positioning  
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

        // Add audio switching function
        function switchAudioSource(freq) {
            // Stop current audio if playing
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            
            // Get new audio element
            const audioId = `radioAudio${freq}`;
            currentAudio = document.getElementById(audioId);
            
            if (currentAudio) {
                // Set volume based on current volume level
                currentAudio.volume = volumeLevel / 5;
                
                // Auto-play if radio was already playing
                if (isPlaying) {
                    currentAudio.play().catch(e => console.log('Audio play failed:', e));
                }
            }
        }

        // Add play/pause functionality
        function togglePlayback() {
            if (!currentAudio) return;
            
            if (isPlaying) {
                currentAudio.pause();
                isPlaying = false;
            } else {
                currentAudio.play().catch(e => console.log('Audio play failed:', e));
                isPlaying = true;
            }
            
            // Update visual indicators
            updatePlayingState();
        }

        function updatePlayingState() {
            const radio = document.getElementById('radio');
            const nowPlayingElement = document.querySelector('.now-playing');
            
            if (isPlaying) {
                if (radio) radio.classList.add('playing');
                if (nowPlayingElement) nowPlayingElement.textContent = 'NOW PLAYING';
                if (radioWaves) radioWaves.style.opacity = '1';
            } else {
                if (radio) radio.classList.remove('playing');
                if (nowPlayingElement) nowPlayingElement.textContent = 'PAUSED';
                if (radioWaves) radioWaves.style.opacity = '0.3';
            }
        }

        // Update signal strength indicator
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
            if (radioWaves) radioWaves.style.opacity = '1';

            // Initialize display and highlight
            updateDisplay(currentFreq);
            highlightStory(currentFreq);
            updateVolumeIndicator();

            // Initialize audio
            switchAudioSource(currentFreq);

            // Simulate radio warmup
            setTimeout(() => {
                updateSignalStrength(currentFreq);
            }, 500);
        }

        // Enhanced tuning knob interaction
        if (tuningKnob) {
            tuningKnob.addEventListener('click', function() {
                if (!isActive) startRadio();

                const currentIndex = frequencies.indexOf(currentFreq);
                const nextIndex = (currentIndex + 1) % frequencies.length;
                currentFreq = frequencies[nextIndex];

                currentRotation += 60;
                this.style.transform = `rotate(${currentRotation}deg)`;

                // Brief static before new station
                setTimeout(() => {
                    updateDisplay(currentFreq);
                    highlightStory(currentFreq);
                }, 150);
            });

            // Add double-click for play/pause
            tuningKnob.addEventListener('dblclick', function() {
                if (!isActive) return;
                togglePlayback();
            });
        }

        // Enhanced volume knob interaction
        if (volumeKnob) {
            volumeKnob.addEventListener('click', function() {
                volumeRotation += 45;
                this.style.transform = `rotate(${volumeRotation}deg)`;

                // First click starts playback, subsequent clicks adjust volume
                if (!isActive) {
                    startRadio();
                    togglePlayback();
                } else {
                    // Cycle volume level (0-5)
                    volumeLevel = (volumeLevel + 1) % 6;
                    
                    // Update audio volume if audio is available
                    if (currentAudio) {
                        currentAudio.volume = volumeLevel / 5;
                    }
                }

                // Update visual indicators
                updateVolumeIndicator();

                // Adjust radio waves opacity based on volume
                const waveOpacity = volumeLevel * 0.2;
                if (radioWaves) radioWaves.style.opacity = Math.max(waveOpacity, 0.1);

                // Visual feedback
                this.style.boxShadow = '0 0 15px rgba(255, 107, 53, 0.8)';
                setTimeout(() => {
                    this.style.boxShadow = '';
                }, 200);
            });
        }

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

        // Enhanced story card interactions
        storyCards.forEach(card => {
            card.addEventListener('click', function() {
                if (!isActive) startRadio();

                const freq = parseFloat(this.dataset.frequency);
                if (freq !== currentFreq) {
                    currentFreq = freq;
                    const index = frequencies.indexOf(freq);
                    currentRotation = index * 60;
                    if (tuningKnob) tuningKnob.style.transform = `rotate(${currentRotation}deg)`;

                    // Simulate tuning delay
                    setTimeout(() => {
                        updateDisplay(currentFreq);
                        highlightStory(currentFreq);
                    }, 150);
                } else {
                    // If clicking the same frequency, toggle play/pause
                    togglePlayback();
                }
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

        // Simulate occasional signal fluctuation
        setInterval(() => {
            if (isActive && Math.random() < 0.1) {
                updateSignalStrength(currentFreq);
            }
        }, 3000);

        // Add keyboard controls for radio
        document.addEventListener('keydown', function(e) {
            if (!isActive) return;

            switch(e.key) {
                case 'ArrowUp':
                case 'ArrowRight':
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

        // Team Section Player Management
        const teamPlayers = new Map();

        // Initialize team players
        document.querySelectorAll('#team .music-player').forEach(playerEl => {
            const playerId = playerEl.dataset.player;
            
            const player = {
                element: playerEl,
                isPlaying: false,
                audio: playerEl.querySelector('audio'),
                currentTime: 0,
                duration: 0,
                
                // Elements
                playBtn: playerEl.querySelector('.play-btn'),
                playIcon: playerEl.querySelector('.play-icon'),
                pauseIcon: playerEl.querySelector('.pause-icon'),
                progressBar: playerEl.querySelector('.progress-bar'),
                progressFill: playerEl.querySelector('.progress-fill'),
                currentTimeEl: playerEl.querySelector('.current-time'),
                totalTimeEl: playerEl.querySelector('.total-time'),
                prevBtn: playerEl.querySelector('.prev-btn'),
                nextBtn: playerEl.querySelector('.next-btn')
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

            teamPlayers.set(playerId, player);
            setupTeamPlayerEvents(player, playerId);
            updateTimeDisplay(player);
        });

        function setupTeamPlayerEvents(player, playerId) {
            // Play/Pause
            // Play/Pause
// Play/Pause
        if (player.playBtn) {
            player.playBtn.addEventListener('click', async () => {
                // Check if THIS player is currently playing before stopping everything
                const wasPlaying = player.isPlaying;
                
                // Stop main radio first
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

            // Previous
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
                        // Add pop animation
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

            // Next
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
                        // Add pop animation
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

            // Progress bar
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

        function playTeamPlayer(player) {
            player.isPlaying = true;
            player.element.classList.add('playing');
            console.log(`Player ${player.element.dataset.player}: playTeamPlayer called, isPlaying: ${player.isPlaying}`);
            updatePlayButton(player);
            if (player.audio) player.audio.play();
        }

        function pauseTeamPlayer(player) {
            player.isPlaying = false;
            player.element.classList.remove('playing');
            console.log(`Player ${player.element.dataset.player}: pauseTeamPlayer called, isPlaying: ${player.isPlaying}`);
            updatePlayButton(player);
            if (player.audio) player.audio.pause();
        }

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

        function updateProgressBar(player) {
            if (player.duration > 0 && player.progressFill) {
                const progress = (player.currentTime / player.duration) * 100;
                player.progressFill.style.width = `${Math.min(progress, 100)}%`;
                console.log(`Player ${player.element.dataset.player}: Progress bar width set to ${player.progressFill.style.width}`);
            }
        }

        function updateTimeDisplay(player) {
            if (player.currentTimeEl) player.currentTimeEl.textContent = formatTime(player.currentTime);
            if (player.totalTimeEl && player.duration > 0) {
                const remaining = Math.max(0, player.duration - player.currentTime);
                player.totalTimeEl.textContent = '-' + formatTime(remaining);
            }
        }

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 DOM loaded, initializing...');
            initializeRadio();
            
            // Play button with enhanced audio functionality
            const playButton = document.querySelector('.play-button');
            if (playButton) {
                playButton.addEventListener('click', async function () {
                    // Initialize audio context on first interaction
                    if (!audioContextInitialized) {
                        audioContextInitialized = true;
                        if (!isActive) startRadio();
                    }

                    // tiny press animation
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => { this.style.transform = ''; }, 150);

                    await toggleMainRadioPlayback();
                });
            }

            // Scan button
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

            function setupEnhancedKnobInteraction() {
    const homeTuningKnob = document.getElementById('homeTuningKnob');
    if (!homeTuningKnob) return;

    let isDragging = false;
    let startAngle = 0;
    let startRotation = 0;

    // Mouse down - start drag
    homeTuningKnob.addEventListener('mousedown', function(e) {
        isDragging = true;
        const rect = this.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        startRotation = homeKnobRotation;
        
        // Add visual feedback
        this.style.transform = 'scale(0.95)';
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
    });

    // Mouse move - drag rotation
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const rect = homeTuningKnob.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        
        let deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
        let newRotation = startRotation + deltaAngle;
        
        // Constrain rotation to realistic range
        newRotation = Math.max(0, Math.min(270, newRotation));
        
        // Snap to nearest station position
        const stationAngle = Math.round(newRotation / 90) * 90;
        const targetStation = stationAngle / 90;
        
        if (targetStation !== currentStationIndex && targetStation >= 0 && targetStation < stations.length) {
            switchToStation(targetStation, false);
        }
    });

    // Mouse up - end drag
    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        
        isDragging = false;
        document.body.style.cursor = '';
        homeTuningKnob.style.transform = '';
    });

    // Mouse wheel support for fine tuning
    homeTuningKnob.addEventListener('wheel', function(e) {
        e.preventDefault();
        const direction = e.deltaY > 0 ? 1 : -1;
        const nextStationIndex = Math.max(0, Math.min(stations.length - 1, currentStationIndex + direction));
        
        if (nextStationIndex !== currentStationIndex) {
            switchToStation(nextStationIndex, true);
        }
    });
}


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

            // Radio mode buttons
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

            // Volume slider
            const homeVolumeSlider = document.getElementById('homeVolumeSlider');
            if (homeVolumeSlider) {
                homeVolumeSlider.addEventListener('input', function() {
                    console.log('Volume:', this.value);
                    
                    // Update audio volume
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