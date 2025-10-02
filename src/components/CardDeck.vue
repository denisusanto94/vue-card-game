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

		<div v-else class="badge-level">
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

		<!-- Two stacks: left=unopened deck, right=opened pile -->
		<div class="stacks">
			<!-- Opened Pile (top) -->
			<div class="stack">
				<div class="stack-info">
					<span>Opened</span>
					<span class="count">({{ opened.length }})</span>
				</div>
				<div class="stack-area">
					<div
						v-for="(card, idx) in opened"
						:key="card.id"
						class="card3d opened"
						:style="cardStyle(idx)"
					>
						<div class="face back" :style="backStyle(card)">🂠</div>
						<div class="face front" :style="frontStyle(card)">
							<img v-if="card.image" class="front-img" :src="card.image" alt="card" />
							<span class="front-label">{{ card.label }}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Unopened Deck (bottom) -->
			<div class="stack coverflow-container">
				<div class="stack-info">
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
							@click.stop="isCenterCard(idx) ? openCard(card.originalIndex) : null"
							@mouseenter="isCenterCard(idx) ? null : showNonClickableFeedback()"
						>
							<div class="face back" :style="backStyle(card)">🂠</div>
							<div class="face front" :style="frontStyle(card)">
								<img v-if="card.image" class="front-img" :src="card.image" alt="card" />
								<span class="front-label">{{ card.label }}</span>
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
					<div class="coverflow-indicators">
						<span 
							v-for="(card, idx) in unopened" 
							:key="card.id"
							class="indicator"
							:class="{ active: idx === centerIndex }"
							@click="centerIndex = idx"
						></span>
					</div>
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
			<button @click="shuffleUnopened" :disabled="isShuffling || remaining === 0">
				{{ isShuffling ? 'Shuffling...' : 'Shuffle Card' }}
			</button>
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
			opened: [],
			isOpening: false,
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
			isShuffling: false
		};
	},
	computed: {
		remaining() { return this.unopened.length; },
		levels() { return [1,2,3,4]; },
		appBackgroundStyle() {
			const style = { minHeight: '100vh' };
			const map = {
				1: require('../assets/background/background-warm.png'),
				2: require('../assets/background/background-hot.png'),
				3: require('../assets/background/background-wild.png'),
				4: require('../assets/background/background-taboo.png')
			};
			const img = map[this.currentLevel];
			if (img) {
				style.backgroundImage = `url(${img})`;
				style.backgroundSize = 'cover';
				style.backgroundPosition = 'center';
				style.backgroundRepeat = 'no-repeat';
			}
			return style;
		},
		visibleCards() {
			// Show cards based on available cards
			const cards = [];
			const totalCards = this.unopened.length;
			
			// Debug: log visible cards computation
			console.log('Visible cards computation:', {
				totalCards,
				centerIndex: this.centerIndex,
				unopened: this.unopened.length,
				unopenedArray: this.unopened
			});
			
			if (totalCards === 0) {
				console.log('No cards available');
				return [];
			}
			
			if (totalCards === 1) {
				// Only show center card
				const card = {
					...this.unopened[0],
					originalIndex: 0
				};
				console.log('Single card:', card);
				return [card];
			}
			
			if (totalCards === 2) {
				// Show both cards side by side
				const cards = [
					{
						...this.unopened[0],
						originalIndex: 0
					},
					{
						...this.unopened[1],
						originalIndex: 1
					}
				];
				console.log('Two cards:', cards);
				return cards;
			}
			
			// Show 3 cards: previous, current, next
			for (let i = -1; i <= 1; i++) {
				const index = this.centerIndex + i;
				if (index >= 0 && index < totalCards) {
					const card = {
						...this.unopened[index],
						originalIndex: index
					};
					cards.push(card);
				}
			}
			console.log('Three+ cards:', cards);
			return cards;
		},
		carouselTrackStyle() {
			// No translation needed since we're only showing 3 cards
			return {};
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
			
			console.log('Card style for idx:', idx, 'total cards:', this.unopened.length);
			
			// Handle single card case (only center card visible)
			if (this.unopened.length === 1) {
				const style = {
					transform: 'translate(-50%, -50%) translateX(0px) translateZ(0px) rotateY(0deg) scale(1)',
					opacity: 1,
					zIndex: 3
				};
				console.log('Single card style:', style);
				return style;
			}
			
			// Handle two cards case
			if (this.unopened.length === 2) {
				const twoCardTranslate = translate * 0.5; // Half the normal spacing
				const twoCardRotate = rotate * 0.5; // Half the normal rotation
				const twoCardZ = translateZ * 0.5; // Half the normal depth
				
				if (idx === 0) { // First card
					const style = {
						transform: `translate(-50%, -50%) translateX(-${twoCardTranslate}px) translateZ(-${twoCardZ}px) rotateY(-${twoCardRotate}deg) scale(0.9)`,
						opacity: 0.8,
						zIndex: 2
					};
					console.log('Two cards - first card style:', style);
					return style;
				} else { // Second card
					const style = {
						transform: `translate(-50%, -50%) translateX(${twoCardTranslate}px) translateZ(-${twoCardZ}px) rotateY(${twoCardRotate}deg) scale(0.9)`,
						opacity: 0.8,
						zIndex: 2
					};
					console.log('Two cards - second card style:', style);
					return style;
				}
			}
			
			// idx: 0 = left, 1 = center, 2 = right (3+ cards)
			const positions = {
				0: { // Left card
					transform: `translate(-50%, -50%) translateX(-${translate}px) translateZ(-${translateZ}px) rotateY(-${rotate}deg) scale(0.8)`,
					opacity: 0.7,
					zIndex: 1
				},
				1: { // Center card
					transform: 'translate(-50%, -50%) translateX(0px) translateZ(0px) rotateY(0deg) scale(1)',
					opacity: 1,
					zIndex: 3
				},
				2: { // Right card
					transform: `translate(-50%, -50%) translateX(${translate}px) translateZ(-${translateZ}px) rotateY(${rotate}deg) scale(0.8)`,
					opacity: 0.7,
					zIndex: 1
				}
			};
			
			const style = positions[idx] || {
				transform: 'translate(-50%, -50%) translateX(0px) translateZ(0px) rotateY(0deg) scale(0.5)',
				opacity: 0,
				zIndex: 0
			};
			
			console.log('Three+ cards style for idx', idx, ':', style);
			return style;
		},
		isCenterCard(idx) {
			const totalCards = this.unopened.length;
			if (totalCards === 1) return idx === 0;
			if (totalCards === 2) return false; // No center card for 2 cards
			return idx === 1; // Center card in 3+ cards
		},
		isLeftCard(idx) {
			const totalCards = this.unopened.length;
			if (totalCards === 1) return false;
			if (totalCards === 2) return idx === 0;
			return idx === 0; // Left card in 3+ cards
		},
		isRightCard(idx) {
			const totalCards = this.unopened.length;
			if (totalCards === 1) return false;
			if (totalCards === 2) return idx === 1;
			return idx === 2; // Right card in 3+ cards
		},
		selectCard(idx) {
			if (idx >= 0 && idx < this.unopened.length) {
				this.centerIndex = idx;
			}
		},
		openCard(idx) {
			console.log('Opening card at index:', idx, 'total cards:', this.unopened.length);
			if (idx >= 0 && idx < this.unopened.length) {
				// Set the clicked card as center first
				this.centerIndex = idx;
				console.log('Center index set to:', this.centerIndex);
				// Then open it
				this.openNext();
			}
		},
		handleCarouselClick(e) {
			// Only open card if not dragging and there are cards
			if (!this.isDragging && this.remaining > 0) {
				// Check if click is on empty area (not on a card)
				if (e.target === e.currentTarget || e.target.classList.contains('carousel-track')) {
					this.openNext();
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
			
			// Infinite scroll: if at first card, go to last
			if (this.centerIndex <= 0) {
				// Smooth transition to last card
				this.centerIndex = this.unopened.length - 1;
			} else {
				this.centerIndex--;
			}
		},
		nextCard() {
			if (this.unopened.length === 0) return;
			
			// Infinite scroll: if at last card, go to first
			if (this.centerIndex >= this.unopened.length - 1) {
				// Smooth transition to first card
				this.centerIndex = 0;
			} else {
				this.centerIndex++;
			}
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
			
			// Only handle horizontal swipes
			if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
				if (deltaX > 0) {
					// Swipe left - next card
					this.nextCard();
				} else {
					// Swipe right - previous card
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
					require('../assets/card/level-1/24.png')
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
			this.opened = [];
			this.unopened = this.createDeckForLevel(level);
			this.centerIndex = 0; // Reset coverflow to first card
			this.loadBgmForLevel(level);
			
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
			// Try to find a bgm file inside assets/bgm matching the level
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
					audio.volume = 0.5;
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
			
			// Fisher-Yates shuffle algorithm
			const unopened = this.unopened;
			for (let i = unopened.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[unopened[i], unopened[j]] = [unopened[j], unopened[i]];
			}
			
			// Set random center index after shuffle
			const randomCenterIndex = Math.floor(Math.random() * unopened.length);
			this.centerIndex = randomCenterIndex;
			
			console.log('Shuffled deck, center card set to index:', randomCenterIndex);
			
			// Reset shuffling state and auto-open the center card
			setTimeout(() => {
				this.isShuffling = false;
				this.openNext();
			}, 500); // Delay to show the shuffle animation
		},
		openNext() {
			if (this.isOpening) return;
			if (this.unopened.length === 0) return;
			if (this.centerIndex < 0 || this.centerIndex >= this.unopened.length) return;
			
			this.isOpening = true;
			const idx = this.centerIndex; // Open the currently selected card
			const card = this.unopened[idx];
			this.playOpenCardSound();
			card.opened = true; // trigger in-place flip on unopened stack
			setTimeout(() => {
				// move after flip completes
				this.unopened.splice(idx, 1);
				this.opened.push(card);
				
				// Adjust center index if needed
				if (this.centerIndex >= this.unopened.length && this.unopened.length > 0) {
					this.centerIndex = this.unopened.length - 1;
				}
				
				this.isOpening = false;
				// Auto-advance when deck is empty
				if (this.unopened.length === 0) {
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


