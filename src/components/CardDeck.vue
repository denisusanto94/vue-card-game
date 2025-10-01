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
			<div class="stack" @click="openNext">
				<div class="stack-info">
					<span>Deck</span>
					<span class="count">({{ remaining }})</span>
				</div>
				<div class="stack-area">
					<div
						v-for="(card, idx) in unopened"
						:key="card.id"
						class="card3d"
						:class="{ opened: card.opened }"
						:style="cardStyle(idx)"
					>
						<div class="face back" :style="backStyle(card)">🂠</div>
						<div class="face front" :style="frontStyle(card)">
							<img v-if="card.image" class="front-img" :src="card.image" alt="card" />
							<span class="front-label">{{ card.label }}</span>
						</div>
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
			<button @click="shuffleUnopened">Shuffle Card</button>
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
			showAuthPage: false
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
		}
	},
	methods: {
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
					require('../assets/card/level-1/5.png')
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
			this.loadBgmForLevel(level);
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
			const unopened = this.unopened;
			for (let i = unopened.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[unopened[i], unopened[j]] = [unopened[j], unopened[i]];
			}
		},
		openNext() {
			if (this.isOpening) return;
			if (this.unopened.length === 0) return;
			this.isOpening = true;
			const idx = this.unopened.length - 1;
			const card = this.unopened[idx];
			this.playOpenCardSound();
			card.opened = true; // trigger in-place flip on unopened stack
			setTimeout(() => {
				// move after flip completes
				this.unopened.splice(idx, 1);
				this.opened.push(card);
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
	},
	beforeUnmount() {
		this.stopBgm();
	}
}
</script>

<style scoped>
@import '../assets/style/card-deck.css';
</style>


