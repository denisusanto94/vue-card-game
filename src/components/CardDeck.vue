<template>
	<div class="deck carddeck-app" :style="appBackgroundStyle">

		<!-- Auth Page (full screen) -->
		<AuthPage
			v-if="showAuthPage"
			:mode="authMode"
			@submit="onAuthSubmit"
			@toggle-mode="toggleAuthMode"
			@guest="continueAsGuest"
		/>

		<div v-else-if="isDisplayBadgeLevel" class="badge-level">
			<div
				v-for="lvl in levels"
				:key="lvl"
				class="badge-item"
				:class="badgeClass(lvl)"
				title="Level"
			>
				<img :src="levelBadgeSrc(lvl)" alt="level-badge" />
			</div>
		</div>

		<!-- Level Up Overlay -->
		<div v-if="showLevelUp" class="levelup-overlay">
			<div class="levelup-content">
				<img class="levelup-badge" :src="levelBadgeSrc(levelUpLevel)" alt="level-badge" />
				<div class="levelup-text">Level {{ levelUpLevel }}</div>
			</div>
		</div>

		<!-- Finish Overlay (max level completed) -->
		<div v-if="showFinish" class="levelup-overlay">
			<div class="levelup-content">
				<div class="levelup-text">Semua level selesai!</div>
				<button class="btn" @click="restartToLevel1">Restart ke Level 1</button>
			</div>
		</div>

		<!-- Auth Modal -->
		<div v-if="showAuth" class="levelup-overlay">
			<div class="levelup-content" style="min-width:260px;">
				<div class="levelup-text" style="margin-bottom:8px;">{{ authMode==='login' ? 'Login' : 'Daftar' }}</div>
				<div style="display:grid; gap:8px; width:100%;">
					<input v-model.trim="authForm.username" placeholder="Username" />
					<input v-model.trim="authForm.password" type="password" placeholder="Password" />
					<button class="btn" @click="authSubmit">{{ authMode==='login' ? 'Masuk' : 'Daftar' }}</button>
					<button class="btn" style="background:#64748b" @click="toggleAuthMode">{{ authMode==='login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login' }}</button>
					<button class="btn" style="background:#94a3b8" @click="closeAuth">Batal</button>
				</div>
			</div>
		</div>

		<!-- Single deck with carousel -->
		<div class="stacks">
			<!-- Deck with opened and unopened cards -->
			<div class="stack coverflow-container">
				<div class="stack-info" style="display: none;">
					<span>Deck</span>
					<span class="count">({{ remaining }})</span>
					<!-- Debug info -->
					<span style="font-size: 12px; color: #888;">[Debug: {{ unopened.length }} cards, visible: {{ visibleCards.length }}]</span>
				</div>
				<div class="carousel-area" 
					:class="{ dragging: isDragging, shuffling: isShuffling }"
					@click="handleCarouselClick"
					@touchstart="handleTouchStart"
					@touchend="handleTouchEnd"
					@mousedown="handleMouseDown"
					@mouseup="handleMouseUp"
					@mouseleave="isDragging = false"
					:style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
				>
					<div class="carousel-track" :style="carouselTrackStyle">
						<div
							v-for="(card, idx) in visibleCards"
						:key="card.id"
							class="card3d carousel-card"
							:class="{ 
								opened: card.opened,
								'is-center': isCenterCard(idx),
								'is-left': isLeftCard(idx),
								'is-right': isRightCard(idx)
							}"
							:style="carouselCardStyle(idx)"
							@click.stop="isCenterCard(idx) && !card.opened ? openCard(idx) : null"
							@mouseenter="isCenterCard(idx) ? null : showNonClickableFeedback()"
					>
						<div class="face back" :style="backStyle(card)"></div>
						<div class="face front" :style="frontStyle(card)">
							<img v-if="card.image" class="front-img" :src="card.image" alt="card" />
							<!-- <span v-if="!card.opened" class="front-label">{{ card.label }}</span> -->
						</div>
					</div>
				</div>
					<!-- Debug: show message if no visible cards -->
					<div v-if="visibleCards.length === 0" style="color: #ff6b6b; padding: 20px; text-align: center;">
						No visible cards! Total cards: {{ unopened.length }}
						<br>
						<button @click="loadLevel(currentLevel)" style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
							Reload Deck
						</button>
			</div>

					<!-- Fallback: show simple cards if carousel fails -->
					<div v-if="visibleCards.length === 0 && unopened.length > 0" style="display: flex; gap: 10px; justify-content: center; align-items: center; min-height: 200px;">
						<div 
							v-for="card in unopened.slice(0, 3)" 
						:key="card.id"
							style="width: 120px; height: 168px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"
					>
							<span style="font-size: 12px; text-align: center;">{{ card.label }}</span>
						</div>
				</div>
					<!-- Coverflow indicators hidden -->
					<!-- <div class="coverflow-indicators">
						<span 
						v-for="(card, idx) in unopened"
						:key="card.id"
							class="indicator"
							:class="{ active: idx === centerIndex }"
							@click="centerIndex = idx"
						></span>
					</div> -->
				</div>
				<div class="empty" v-if="remaining === 0">Empty</div>
			</div>
		</div>

		<div class="controls">
			<!-- <label>
				Level:
				<select v-model.number="currentLevel" @change="onLevelChange">
					<option :value="1">1</option>
					<option :value="2">2</option>
					<option :value="3">3</option>
					<option :value="4">4</option>
				</select>
			</label> -->
			<button @click="shuffleUnopened" :disabled="isShuffling || remaining === 0" class="play-button">
				<span v-if="isShuffling">Shuffling...</span>
			</button>
		</div>

		<!-- Love Meter -->
		<div class="love-meter">
			<div class="love-meter-container">
				<!-- <img class="love-meter-bg" src="../assets/love-meter-icon-container-2.png" alt="Love Meter" /> -->
				<div class="love-meter-track">
					<div class="love-meter-fill" :style="{ width: loveMeterPercentage + '%' }">
						<div class="love-meter-fill-bg"></div>
					</div>
					<img class="love-meter-heart" src="../assets/love-meter-icon-love.png" alt="Love" :style="{ left: loveHeartLeft + '%' }" />
				</div>
			</div>
		</div>

		<!-- Volume Control -->
		<div class="volume-control" :class="{ 'show': showVolumeControl }">
			<div class="volume-panel">
				<div class="volume-header">
					<span class="volume-title">Volume</span>
					<button class="volume-close" @click="showVolumeControl = false">×</button>
				</div>
				<div class="volume-slider-container">
					<button class="volume-mute-btn" @click="toggleMute" :class="{ 'muted': isMuted }">
						{{ isMuted ? '🔇' : '🔊' }}
					</button>
					<input 
						type="range" 
						min="0" 
						max="1" 
						step="0.1" 
						v-model="volume" 
						@input="updateVolume"
						class="volume-slider"
						:disabled="isMuted"
					/>
					<span class="volume-value">{{ Math.round(volume * 100) }}%</span>
				</div>
			</div>
		</div>

		<!-- Volume Toggle Button -->
		<div class="volume-toggle" @click="showVolumeControl = !showVolumeControl">
			{{ isMuted ? '🔇' : '🔊' }}
		</div>

		<!-- User bar -->
		<div class="user-bar">
			<span class="name">{{ user ? user.username : 'Guest' }}</span>
			<button v-if="!user" class="btn" @click="navigateToLogin('register')">Daftar</button>
			<button v-if="!user" class="btn" style="background:#64748b" @click="navigateToLogin('login')">Login</button>
			<button v-else class="btn" style="background:#ef4444" @click="logout">Logout</button>
		</div>
	</div>
</template>

<script>
import AuthPage from './AuthPage.vue';
export default {
	name: 'CardDeck',
	components: { AuthPage },
	data() {
		return {
			unopened: [],
			isOpening: false,
			isDisplayBadgeLevel: false,
			flipDurationMs: 520,
			currentLevel: 1,
			showLevelUp: false,
			levelUpLevel: 1,
			showFinish: false,
			audioOpenCard: null,
			audioLevelUp: null,
			audioLevelWin: null,
			audioBgm: null,
			currentBgmKey: null,
			// --- Volume Control ---
			volume: 0.5,
			isMuted: false,
			showVolumeControl: false,
			// --- Auth ---
			user: null,
			isGuest: false,
			showAuth: false,
			authMode: 'login',
			authForm: { username: '', password: '' },
			pendingNextLevel: null,
			showAuthPage: false,
			// --- Coverflow ---
			centerIndex: 0,
			// --- Swipe/Touch support ---
			touchStartX: 0,
			touchStartY: 0,
			touchEndX: 0,
			touchEndY: 0,
			isDragging: false,
			dragStartX: 0,
			swipeThreshold: 50,
			// --- Shuffle animation ---
			isShuffling: false,
			// --- Love Meter ---
			loveMeterLevel: 0
		};
	},
	computed: {
		remaining() { return this.unopened.filter(card => !card.opened).length; },
		loveMeterPercentage() {
			// Calculate love meter based on opened cards in current level
			const totalCards = this.unopened.length;
			const openedCards = this.unopened.filter(card => card.opened).length;
			return totalCards > 0 ? Math.round((openedCards / totalCards) * 100) : 0;
		},
		loveHeartLeft() {
			// Clamp to keep the heart fully inside the track (2% padding each side)
			const p = this.loveMeterPercentage;
			return Math.max(2, Math.min(98, p));
		},
		levels() { return [1,2,3,4]; },
		appBackgroundStyle() {
			const style = { minHeight: '100vh' };
			// Use the same background image for all levels
			const img = require('../assets/background/background-main-2.png');
			style.backgroundImage = `url(${img})`;
			style.backgroundSize = 'cover';
			style.backgroundPosition = 'center';
			style.backgroundRepeat = 'no-repeat';
			return style;
		},
		visibleCards() {
			// Show all cards in carousel (both opened and unopened)
			const allCards = this.unopened;
			const cards = [];
			
			if (allCards.length === 0) {
				return [];
			}
			
			// Ensure centerIndex is within bounds
			let validCenterIndex = this.centerIndex;
			if (validCenterIndex < 0) {
				validCenterIndex = allCards.length - 1;
			}
			if (validCenterIndex >= allCards.length) {
				validCenterIndex = 0;
			}
			
			// Debug: log visible cards computation
			console.log('Visible cards computation:', {
				totalCards: this.unopened.length,
				allCards: allCards.length,
				centerIndex: this.centerIndex,
				validCenterIndex: validCenterIndex,
				remaining: this.remaining
			});
			
			// Always show 3 cards with infinite loop
			for (let i = -1; i <= 1; i++) {
				let index = validCenterIndex + i;
				
				// Handle infinite loop for left card
				if (index < 0) {
					index = allCards.length - 1;
				}
				// Handle infinite loop for right card
				else if (index >= allCards.length) {
					index = 0;
				}
				
				const card = {
					...allCards[index],
					originalIndex: index,
					position: i // -1 = left, 0 = center, 1 = right
				};
				cards.push(card);
			}
			
			console.log('Infinite 3 cards:', cards);
			return cards;
		},
		carouselTrackStyle() {
			// No translation needed since we're only showing 3 cards
			return {};
		}
	},
	watch: {
		// Watch for changes in unopened cards and adjust centerIndex accordingly
		unopened: {
			handler() {
				this.$nextTick(() => {
					this.ensureValidCenterIndex();
					console.log('Unopened array changed, current length:', this.unopened.length);
					console.log('Unopened cards (not opened):', this.unopened.filter(card => !card.opened).length);
				});
			},
			deep: true
		}
	},
	methods: {
		// --- Carousel methods ---
		carouselCardStyle(idx) {
			// Get responsive values based on screen size
			const getResponsiveValues = () => {
				const width = window.innerWidth || 1024; // fallback for SSR
				if (width <= 599) {
					return { translate: 140, rotate: 25, translateZ: 50 };
				} else if (width <= 1023) {
					return { translate: 160, rotate: 28, translateZ: 60 };
				} else {
					return { translate: 200, rotate: 30, translateZ: 80 };
				}
			};
			
			const { translate, rotate, translateZ } = getResponsiveValues();
			
			console.log('Card style for idx:', idx, 'infinite carousel');
			
			// Always 3 cards layout: idx 0 = left, 1 = center, 2 = right
			const positions = {
				0: { // Left card
					transform: `translate(-50%, -50%) translateX(-${translate}px) translateZ(-${translateZ}px) rotateY(-${rotate}deg) scale(0.5)`,
					opacity: 0.7,
					zIndex: 1
				},
				1: { // Center card
					transform: 'translate(-50%, -50%) translateX(0px) translateZ(0px) rotateY(0deg) scale(1.35)',
					opacity: 1,
					zIndex: 3
				},
				2: { // Right card
					transform: `translate(-50%, -50%) translateX(${translate}px) translateZ(-${translateZ}px) rotateY(${rotate}deg) scale(0.5)`,
					opacity: 0.7,
					zIndex: 1
				}
			};
			
			const style = positions[idx] || {
				transform: 'translate(-50%, -50%) translateX(0px) translateZ(0px) rotateY(0deg) scale(0.5)',
				opacity: 0,
				zIndex: 0
			};
			
			console.log('Infinite carousel style for idx', idx, ':', style);
			return style;
		},
		isCenterCard(idx) {
			// Always 3 cards: idx 0 = left, idx 1 = center, idx 2 = right
			const isCenter = idx === 1;
			console.log('isCenterCard:', { idx, isCenter });
			return isCenter;
		},
		isLeftCard(idx) {
			// Always 3 cards: idx 0 = left, idx 1 = center, idx 2 = right
			return idx === 0;
		},
		isRightCard(idx) {
			// Always 3 cards: idx 0 = left, idx 1 = center, idx 2 = right
			return idx === 2;
		},
		selectCard(idx) {
			if (idx >= 0 && idx < this.unopened.length) {
				this.centerIndex = idx;
			} else if (this.unopened.length > 0) {
				// If index is out of bounds, set to valid range
				this.centerIndex = Math.max(0, Math.min(idx, this.unopened.length - 1));
			}
		},
		openCard(idx) {
			console.log('openCard called with idx:', idx);
			console.log('Opening card at visible index:', idx, 'total cards:', this.unopened.length);
			
			if (idx >= 0 && idx < this.visibleCards.length) {
				// Get the actual card from visibleCards
				const card = this.visibleCards[idx];
				if (card && !card.opened) {
					// Find the actual index in the unopened array
					const actualIndex = this.unopened.findIndex(c => c.id === card.id);
					if (actualIndex >= 0) {
						// Set the clicked card as center first
						this.centerIndex = actualIndex;
						console.log('Center index set to:', this.centerIndex);
						
						// Update BGM for level 1 if needed
						if (this.currentLevel === 1) {
							this.loadDynamicBgmForLevel1();
						}
						
						// Then open it
						this.openNext();
					} else {
						console.log('Could not find card in unopened array');
					}
				} else {
					console.log('Card already opened or not found');
				}
			} else {
				console.log('Invalid idx:', idx, 'visible cards:', this.visibleCards.length);
			}
		},
		// Helper function to ensure centerIndex is always valid for infinite carousel
		ensureValidCenterIndex() {
			console.log('ensureValidCenterIndex:', {
				totalCards: this.unopened.length,
				currentCenterIndex: this.centerIndex
			});
			
			if (this.unopened.length === 0) {
				this.centerIndex = 0;
				return;
			}
			
			// Handle infinite loop bounds
			if (this.centerIndex < 0) {
				this.centerIndex = this.unopened.length - 1;
			}
			if (this.centerIndex >= this.unopened.length) {
				this.centerIndex = 0;
			}
			
			console.log('centerIndex after validation:', this.centerIndex);
		},
		handleCarouselClick(e) {
			// Only open card if not dragging and there are unopened cards
			if (!this.isDragging && this.remaining > 0) {
				// Check if click is on empty area (not on a card)
				if (e.target === e.currentTarget || e.target.classList.contains('carousel-track')) {
					// Ensure centerIndex is valid before opening
					this.ensureValidCenterIndex();
					
					// Check if the center card is not already opened
					const centerCard = this.unopened[this.centerIndex];
					if (centerCard && !centerCard.opened) {
						// Open the center card
						this.openNext();
					} else {
						console.log('Center card already opened or not found');
					}
				}
			}
		},
		showNonClickableFeedback() {
			// Visual feedback untuk kartu yang tidak bisa diklik
			// Bisa ditambahkan toast message atau visual indicator
			console.log('This card is not clickable. Only center card can be opened.');
		},
		previousCard() {
			if (this.unopened.length === 0) return;
			
			// Ensure centerIndex is valid before navigation
			this.ensureValidCenterIndex();
			
			// Infinite scroll: if at first card, go to last
			if (this.centerIndex <= 0) {
				// Smooth transition to last card
				this.centerIndex = this.unopened.length - 1;
			} else {
				this.centerIndex--;
			}
			
			// Update BGM for level 1 if needed
			if (this.currentLevel === 1) {
				this.loadDynamicBgmForLevel1();
			}
			
			console.log('Previous card - centerIndex:', this.centerIndex, 'total cards:', this.unopened.length);
		},
		nextCard() {
			if (this.unopened.length === 0) return;
			
			// Ensure centerIndex is valid before navigation
			this.ensureValidCenterIndex();
			
			// Infinite scroll: if at last card, go to first
			if (this.centerIndex >= this.unopened.length - 1) {
				// Smooth transition to first card
				this.centerIndex = 0;
			} else {
				this.centerIndex++;
			}
			
			// Update BGM for level 1 if needed
			if (this.currentLevel === 1) {
				this.loadDynamicBgmForLevel1();
			}
			
			console.log('Next card - centerIndex:', this.centerIndex, 'total cards:', this.unopened.length);
		},
		// --- Swipe/Touch methods ---
		handleTouchStart(e) {
			this.touchStartX = e.touches[0].clientX;
			this.touchStartY = e.touches[0].clientY;
			this.isDragging = true;
		},
		handleTouchEnd(e) {
			if (!this.isDragging) return;
			
			this.touchEndX = e.changedTouches[0].clientX;
			this.touchEndY = e.changedTouches[0].clientY;
			this.isDragging = false;
			
			this.handleSwipe();
		},
		handleMouseDown(e) {
			this.dragStartX = e.clientX;
			this.isDragging = true;
			e.preventDefault();
		},
		handleMouseUp(e) {
			if (!this.isDragging) return;
			
			const dragEndX = e.clientX;
			const dragDistance = this.dragStartX - dragEndX;
			
			this.isDragging = false;
			
			// Only navigate if drag distance is significant
			if (Math.abs(dragDistance) > this.swipeThreshold) {
				if (dragDistance > 0) {
					this.nextCard();
				} else {
					this.previousCard();
				}
			}
		},
		handleSwipe() {
			const deltaX = this.touchStartX - this.touchEndX;
			const deltaY = this.touchStartY - this.touchEndY;
			
			console.log('Swipe detected:', { deltaX, deltaY, threshold: this.swipeThreshold });
			
			// Only handle horizontal swipes
			if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
				if (deltaX > 0) {
					// Swipe left - next card
					console.log('Swipe left - going to next card');
					this.nextCard();
				} else {
					// Swipe right - previous card
					console.log('Swipe right - going to previous card');
					this.previousCard();
				}
			}
		},
		// --- Auth helpers ---
		loadAuth() {
			try {
				const raw = localStorage.getItem('user');
				this.user = raw ? JSON.parse(raw) : null;
				this.isGuest = localStorage.getItem('guest') === '1';
			} catch (e) { this.user = null; this.isGuest = false; }
		},
		saveAuth() {
			try {
				if (this.user) localStorage.setItem('user', JSON.stringify(this.user));
				else localStorage.removeItem('user');
			} catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.debug('saveAuth failed', e);
				}
			}
		},
		openAuth(mode = 'login') { this.authMode = mode; this.showAuth = true; },
		closeAuth() { this.showAuth = false; this.authForm.username=''; this.authForm.password=''; },
		toggleAuthMode() { this.authMode = this.authMode === 'login' ? 'register' : 'login'; },
		navigateToLogin(mode = 'login') {
			try {
				localStorage.clear();
			} catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.debug('clear storage failed', e);
				}
			}
			if (this.$router) {
				this.$router.push({ name: 'login', query: { mode } });
			}
		},
		continueAsGuest() {
			this.user = null; this.showAuthPage = false; this.saveAuth();
			try { localStorage.setItem('guest', '1'); } catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.debug('set guest failed', e);
				}
			}
		},
		logout() {
			this.stopBgm();
			this.user = null;
			this.saveAuth();
			try { localStorage.removeItem('guest'); } catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.debug('remove guest failed', e);
				}
			}
			if (this.$router) this.$router.push({ name: 'login' });
		},
		onAuthSubmit({ username, password }) {
			if (!username || !password) return;
			const key = 'users';
			const list = JSON.parse(localStorage.getItem(key) || '[]');
			if (this.authMode === 'register') {
				if (list.find(u => u.username === username)) return;
				list.push({ username, password });
				localStorage.setItem(key, JSON.stringify(list));
				this.user = { username };
				this.saveAuth();
				this.showAuth = false; this.showAuthPage = false;
			} else {
				const match = list.find(u => u.username === username && u.password === password);
				if (!match) return;
				this.user = { username };
				this.saveAuth();
				this.showAuth = false; this.showAuthPage = false;
			}
			// resume queued level
			if (this.pendingNextLevel) {
				const next = this.pendingNextLevel; this.pendingNextLevel = null;
				this.currentLevel = next; this.loadLevel(this.currentLevel); this.showLevelUpOverlay(this.currentLevel);
			}
		},
		createDeckForLevel(level) {
			const byLevel = {
				1: [
					require('../assets/card/level-1/1.png'),
					require('../assets/card/level-1/2.png'),
					require('../assets/card/level-1/3.png'),
					require('../assets/card/level-1/4.png'),
					require('../assets/card/level-1/5.png'),
					require('../assets/card/level-1/6.png'),
					require('../assets/card/level-1/7.png'),
					require('../assets/card/level-1/8.png'),
					require('../assets/card/level-1/9.png'),
					require('../assets/card/level-1/10.png'),
					require('../assets/card/level-1/11.png'),
					require('../assets/card/level-1/12.png'),
					require('../assets/card/level-1/13.png'),
					require('../assets/card/level-1/14.png'),
					require('../assets/card/level-1/15.png'),
					require('../assets/card/level-1/16.png'),
					require('../assets/card/level-1/17.png'),
					require('../assets/card/level-1/18.png'),
					require('../assets/card/level-1/19.png'),
					require('../assets/card/level-1/20.png'),
					require('../assets/card/level-1/21.png'),
					require('../assets/card/level-1/22.png'),
					require('../assets/card/level-1/23.png'),
					require('../assets/card/level-1/24.png'),
					require('../assets/card/level-1/25.png')
				],
				2: [
					require('../assets/card/level-2/1.png'),
					require('../assets/card/level-2/2.png'),
					require('../assets/card/level-2/3.png'),
					require('../assets/card/level-2/4.png'),
					require('../assets/card/level-2/5.png')
				],
				3: [
					require('../assets/card/level-3/1.png'),
					require('../assets/card/level-3/2.png'),
					require('../assets/card/level-3/3.png'),
					require('../assets/card/level-3/4.png'),
					require('../assets/card/level-3/5.png')
				],
				4: [
					require('../assets/card/level-4/1.png'),
					require('../assets/card/level-4/2.png'),
					require('../assets/card/level-4/3.png'),
					require('../assets/card/level-4/4.png'),
					require('../assets/card/level-4/5.png')
				]
			};
			const images = byLevel[level] || [];
			let id = 0;
			return images.map((img, idx) => {
				const image = img && img.default ? img.default : img;
				return { id: id++, label: `Level ${level}-${idx + 1}`, opened: false, level, image };
			});
		},
		loadLevel(level) {
			this.unopened = this.createDeckForLevel(level);
			this.centerIndex = 0; // Reset coverflow to first card
			this.loadBgmForLevel(level);
			
			// For level 1, ensure BGM is loaded after a short delay
			if (level === 1) {
				setTimeout(() => {
					this.loadDynamicBgmForLevel1();
				}, 100);
			}
			
			// Debug: log to console to check if deck is loaded
			console.log('Deck loaded:', {
				level,
				unopenedCount: this.unopened.length,
				remaining: this.remaining
			});
		},
		showLevelUpOverlay(level) {
			this.levelUpLevel = level;
			this.playLevelUpSound();
			this.showLevelUp = true;
			setTimeout(() => { this.showLevelUp = false; }, 1200);
		},
		playLevelUpSound() {
			try {
				if (!this.audioLevelUp) {
					this.audioLevelUp = new Audio(require('../assets/sound/level-up.mp3'));
					this.audioLevelUp.preload = 'auto';
				}
				this.audioLevelUp.currentTime = 0;
				const maybePromise = this.audioLevelUp.play();
				if (maybePromise && typeof maybePromise.catch === 'function') {
					maybePromise.catch((err) => { if (process.env.NODE_ENV !== 'production') { /* eslint-disable-next-line no-console */ console.debug('level-up play blocked', err); } });
				}
			} catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.debug('level-up sound play failed', e);
				}
			}
		},
		playLevelWinSound() {
			// Using dialog-yes.mp3 as the win jingle; replace if you add level-win.mp3
			try {
				if (!this.audioLevelWin) {
					this.audioLevelWin = new Audio(require('../assets/sound/dialog-yes.mp3'));
					this.audioLevelWin.preload = 'auto';
				}
				this.audioLevelWin.currentTime = 0;
				const maybePromise = this.audioLevelWin.play();
				if (maybePromise && typeof maybePromise.catch === 'function') {
					maybePromise.catch((err) => { if (process.env.NODE_ENV !== 'production') { /* eslint-disable-next-line no-console */ console.debug('level-win play blocked', err); } });
				}
			} catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.debug('level-win sound play failed', e);
				}
			}
		},
		restartToLevel1() {
			this.showFinish = false;
			this.currentLevel = 1;
			this.loadLevel(this.currentLevel);
		},
		levelBadgeSrc(level) {
			switch (level) {
				case 1: return require('../assets/level-badge/level-1.svg');
				case 2: return require('../assets/level-badge/level-2.svg');
				case 3: return require('../assets/level-badge/level-3.svg');
				case 4: return require('../assets/level-badge/level-4.svg');
				default: return require('../assets/level-badge/level-1.svg');
			}
		},
		// --- Background music per level ---
		stopBgm() {
			if (this.audioBgm) {
				try { this.audioBgm.pause(); } catch (e) { if (process.env.NODE_ENV !== 'production') { /* eslint-disable-next-line no-console */ console.debug('bgm pause failed', e); } }
				this.audioBgm = null;
				this.currentBgmKey = null;
			}
		},
		loadBgmForLevel(level) {
			// For level 1, use dynamic BGM based on card position
			if (level === 1) {
				this.loadDynamicBgmForLevel1();
				return;
			}
			
			// For other levels, use the original logic
			let bgmSrc = null;
			try {
				const ctx = require.context('../assets/bgm', false, /\.(mp3|ogg|wav)$/);
				const keys = ctx.keys();
				if (keys && keys.length) {
					const nameByLevel = { 1: 'warm', 2: 'hot', 3: 'wild', 4: 'taboo' };
					const candidates = [
						// Preferred naming: bgm-(level).ext
						`./bgm-${level}.mp3`, `./bgm-${level}.ogg`, `./bgm-${level}.wav`,
						// Legacy/fallback: level-(level).ext
						`./level-${level}.mp3`, `./level-${level}.ogg`, `./level-${level}.wav`,
						// Named variants fallback
						`./${nameByLevel[level] || ''}.mp3`, `./${nameByLevel[level] || ''}.ogg`, `./${nameByLevel[level] || ''}.wav`
					].filter(Boolean);
					let chosenKey = null;
					for (const cand of candidates) {
						if (keys.includes(cand)) { chosenKey = cand; break; }
					}
					if (!chosenKey) {
						// fallback to first file if nothing matches
						chosenKey = keys[0];
					}
					bgmSrc = ctx(chosenKey);
					bgmSrc = bgmSrc && bgmSrc.default ? bgmSrc.default : bgmSrc;
				}
			} catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.debug('bgm context missing or load error', e);
				}
			}
			// Play if we have a source and it differs from current
			if (bgmSrc && bgmSrc !== this.currentBgmKey) {
				this.stopBgm();
				try {
					const audio = new Audio(bgmSrc);
					audio.loop = true;
					audio.volume = this.isMuted ? 0 : this.volume;
					const maybe = audio.play();
					if (maybe && typeof maybe.catch === 'function') { maybe.catch((err) => { if (process.env.NODE_ENV !== 'production') { /* eslint-disable-next-line no-console */ console.debug('bgm play blocked', err); } }); }
					this.audioBgm = audio;
					this.currentBgmKey = bgmSrc;
				} catch (e) {
					if (process.env.NODE_ENV !== 'production') {
						// eslint-disable-next-line no-console
						console.debug('bgm play failed', e);
					}
				}
			}
		},
		loadDynamicBgmForLevel1() {
			// Get the current card index (0-based)
			const currentCardIndex = this.centerIndex;
			const cardNumber = currentCardIndex + 1; // Convert to 1-based
			
			let bgmFile = '';
			if (cardNumber >= 1 && cardNumber <= 13) {
				bgmFile = 'bgm-1-1.wav';
			} else if (cardNumber >= 14 && cardNumber <= 20) {
				bgmFile = 'bgm-1-2.wav';
			} else if (cardNumber >= 21 && cardNumber <= 25) {
				bgmFile = 'bgm-1-3.wav';
			} else {
				// Fallback to first BGM
				bgmFile = 'bgm-1-1.wav';
			}
			
			console.log(`Card ${cardNumber}: Should play ${bgmFile}`);
			
			try {
				// Use require.context to get the BGM file
				const ctx = require.context('../assets/bgm', false, /\.(mp3|ogg|wav)$/);
				const keys = ctx.keys();
				const bgmKey = `./${bgmFile}`;
				
				if (keys.includes(bgmKey)) {
					const bgmSrc = ctx(bgmKey);
					const bgmUrl = bgmSrc && bgmSrc.default ? bgmSrc.default : bgmSrc;
					
					console.log(`Found BGM file: ${bgmFile}, URL:`, bgmUrl);
					
					// Only change BGM if it's different from current to prevent restart
					if (bgmUrl !== this.currentBgmKey) {
						this.stopBgm();
					const audio = new Audio(bgmUrl);
					audio.loop = true;
					audio.volume = this.isMuted ? 0 : this.volume;
						const maybe = audio.play();
						if (maybe && typeof maybe.catch === 'function') {
							maybe.catch((err) => {
								if (process.env.NODE_ENV !== 'production') {
									// eslint-disable-next-line no-console
									console.debug('dynamic bgm play blocked', err);
								}
							});
						}
						this.audioBgm = audio;
						this.currentBgmKey = bgmUrl;
						
						console.log(`✅ Playing ${bgmFile} for card ${cardNumber}`);
					} else {
						console.log(`🎵 BGM already playing: ${bgmFile} for card ${cardNumber} - no restart needed`);
					}
				} else {
					console.error(`❌ BGM file not found: ${bgmFile}`);
					console.log('Available files:', keys);
				}
			} catch (e) {
				console.error('❌ Dynamic BGM load failed:', e);
			}
		},
		// Test method to manually switch BGM ranges (for debugging)
		testBgmRanges() {
			if (this.currentLevel === 1) {
				console.log('Testing BGM ranges for Level 1:');
				console.log('Current centerIndex:', this.centerIndex);
				console.log('Current card number:', this.centerIndex + 1);
				this.loadDynamicBgmForLevel1();
			}
		},
		// --- Volume Control Methods ---
		updateVolume() {
			// Update BGM volume
			if (this.audioBgm) {
				this.audioBgm.volume = this.isMuted ? 0 : this.volume;
			}
			
			// Update other audio elements
			const audioElements = [
				this.audioOpenCard,
				this.audioLevelUp,
				this.audioLevelWin,
				this.audioSwipe
			];
			
			audioElements.forEach(audio => {
				if (audio) {
					audio.volume = this.isMuted ? 0 : this.volume;
				}
			});
			
			// Save volume to localStorage
			localStorage.setItem('gameVolume', this.volume.toString());
			localStorage.setItem('gameMuted', this.isMuted.toString());
		},
		toggleMute() {
			this.isMuted = !this.isMuted;
			this.updateVolume();
		},
		loadVolumeSettings() {
			// Load volume settings from localStorage
			const savedVolume = localStorage.getItem('gameVolume');
			const savedMuted = localStorage.getItem('gameMuted');
			
			if (savedVolume !== null) {
				this.volume = parseFloat(savedVolume);
			}
			if (savedMuted !== null) {
				this.isMuted = savedMuted === 'true';
			}
			
			// Apply settings
			this.updateVolume();
		},
		badgeClass(level) {
			return {
				active: this.currentLevel === level,
				passed: this.currentLevel > level
			};
		},
		onLevelChange() {
			if (this.isOpening) return;
			this.loadLevel(this.currentLevel);
		},
		cardStyle(idx) {
			const offset = idx * 0.8; // small vertical stacking
			return { '--stackTransform': `translateY(${offset}px)`, zIndex: idx + 1 };
		},
		frontStyle(card) {
			// Fallback: if image available, use as background; otherwise white
			const style = {};
			if (card && card.image) {
				style.backgroundImage = `url(${card.image})`;
				style.backgroundSize = 'contain';
				style.backgroundRepeat = 'no-repeat';
				style.backgroundPosition = 'center';
				style.backgroundColor = '#f0f0f0';
			} else {
				style.backgroundColor = '#ffffff';
			}
			return style;
		},
		backStyle(card) {
			const style = {};
			if (card && card.opened && card.image) {
				style.backgroundImage = `url(${card.image})`;
				style.backgroundSize = 'contain';
				style.backgroundRepeat = 'no-repeat';
				style.backgroundPosition = 'center';
				style.color = 'transparent';
			}
			return style;
		},
		playOpenCardSound() {
			try {
				if (!this.audioOpenCard) {
					this.audioOpenCard = new Audio(require('../assets/sound/open-card.mp3'));
					this.audioOpenCard.preload = 'auto';
				}
				this.audioOpenCard.currentTime = 0;
				const maybePromise = this.audioOpenCard.play();
				if (maybePromise && typeof maybePromise.catch === 'function') {
					maybePromise.catch((err) => { if (process.env.NODE_ENV !== 'production') { /* eslint-disable-next-line no-console */ console.debug('open-card play blocked', err); } });
				}
			} catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					// ignore audio play errors (autoplay policy or user gesture)
					// eslint-disable-next-line no-console
					console.debug('open-card sound play failed', e);
				}
			}
		},
		shuffleUnopened() {
			if (this.unopened.length === 0) return;
			
			// Set shuffling state for animation
			this.isShuffling = true;
			
			// Fisher-Yates shuffle algorithm - only shuffle unopened cards
			const unopenedCards = this.unopened.filter(card => !card.opened);
			const openedCards = this.unopened.filter(card => card.opened);
			
			// Shuffle only unopened cards
			for (let i = unopenedCards.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[unopenedCards[i], unopenedCards[j]] = [unopenedCards[j], unopenedCards[i]];
			}
			
			// Combine shuffled unopened cards with opened cards
			this.unopened = [...unopenedCards, ...openedCards];
			
			// Set random center index to an unopened card
			if (unopenedCards.length > 0) {
				const randomCenterIndex = Math.floor(Math.random() * unopenedCards.length);
				this.centerIndex = randomCenterIndex;
			} else {
				this.centerIndex = 0;
			}
			
			// Ensure centerIndex is valid
			if (this.centerIndex < 0) {
				this.centerIndex = 0;
			}
			
			console.log('Shuffled deck, center card set to index:', this.centerIndex);
			
			// Reset shuffling state and auto-open the center card
			setTimeout(() => {
				this.isShuffling = false;
				
				// Update BGM for level 1 if needed (same as card navigation)
				if (this.currentLevel === 1) {
					this.loadDynamicBgmForLevel1();
				}
				
				if (unopenedCards.length > 0) {
					this.openNext();
				}
			}, 500); // Delay to show the shuffle animation
		},
		openNext() {
			if (this.isOpening) return;
			if (this.unopened.length === 0) return;
			
			// Ensure centerIndex is valid
			this.ensureValidCenterIndex();
			
			// Get the card at centerIndex
			const card = this.unopened[this.centerIndex];
			if (!card || card.opened) {
				console.log('Card not found or already opened:', card);
				return; // Don't open already opened cards
			}
			
			this.isOpening = true;
			console.log('Opening card:', card.label, 'at index:', this.centerIndex);
			console.log('Card before opening:', card);
			this.playOpenCardSound();
			card.opened = true; // trigger in-place flip on unopened stack
			console.log('Card after setting opened=true:', card);
			setTimeout(() => {
				this.isOpening = false;
				
				// Don't adjust center index - keep it pointing to the same card
				// The opened card will remain visible in carousel
				console.log('Card opened, centerIndex remains:', this.centerIndex);
				
				// Check if there are any unopened cards left
				const remainingUnopenedCards = this.unopened.filter(card => !card.opened);
				
				// Auto-advance when all cards are opened
				if (remainingUnopenedCards.length === 0) {
					// if already at max level, play win sound and show finish overlay
					if (this.currentLevel >= 4) {
						this.playLevelWinSound();
						setTimeout(() => { this.showFinish = true; }, 300);
					} else {
						const nextLevel = this.currentLevel + 1;
						// Guest restriction: level > 2 requires login
						const requiresAuth = !this.user && nextLevel > 2;
						setTimeout(() => {
							if (requiresAuth) {
								this.pendingNextLevel = nextLevel;
								this.openAuth('register');
							} else {
								this.currentLevel = nextLevel;
								this.showLevelUpOverlay(this.currentLevel);
								this.loadLevel(this.currentLevel);
							}
						}, 300);
					}
				}
			}, this.flipDurationMs);
		}
	},
	mounted() {
		this.loadLevel(this.currentLevel);
		this.loadAuth();
		this.loadVolumeSettings();
		// If neither user nor guest, show auth page
		this.showAuthPage = !(this.user || this.isGuest);
		
		// Add keyboard navigation for coverflow
		this.keyboardHandler = (e) => {
			if (this.showAuthPage || this.showAuth || this.showLevelUp || this.showFinish) return;
			
			switch(e.key) {
				case 'ArrowLeft':
					e.preventDefault();
					this.previousCard();
					break;
				case 'ArrowRight':
					e.preventDefault();
					this.nextCard();
					break;
				case 'Enter':
				case ' ':
					e.preventDefault();
					this.openNext();
					break;
			}
		};
		document.addEventListener('keydown', this.keyboardHandler);
	},
	beforeUnmount() {
		this.stopBgm();
		if (this.keyboardHandler) {
			document.removeEventListener('keydown', this.keyboardHandler);
		}
	}
}
</script>

<style scoped>
@import '../assets/style/card-deck.css';
</style>


