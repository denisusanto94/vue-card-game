<template>
	<div class="auth-page">
		<!-- Background Effects -->
		<div class="bg-effects">
			<div class="bg-blur-1"></div>
			<div class="bg-blur-2"></div>
		</div>
		
		<!-- Header -->
		<div class="header">
			<div class="brand">
				<img class="login-logo" src="../assets/login-logo.png" alt="Wild Loov Logo" />
			</div>
		</div>

		<!-- Login Form -->
		<div class="login-section">
			<div class="login-card">
				<div class="background-image"></div>
				<div class="card-content">
					<h1 class="welcome-title">{{ pageMode === 'login' ? 'SELAMAT DATANG' : 'DAFTAR AKUN BARU' }}</h1>
					<div class="intro-text">
						<p class="ready-text">{{ pageMode === 'login' ? 'Ready to Play?' : 'Join the Adventure!' }}</p>
						<p class="description">{{ pageMode === 'login' ? 'Wild Loov hadir buat kalian yang berani buka batasan, eksplor fantasi, dan nikmatin keseruan bareng tanpa malu.' : 'Buat akun baru untuk membuka semua level hingga level 4 dan nikmati pengalaman yang lebih lengkap.' }}</p>
					</div>
					
					<div class="auth-form">
						<div class="input-group">
							<div class="input-icon">👤</div>
							<input class="auth-input" v-model.trim="username" placeholder="Username" />
						</div>
						<div class="input-group">
							<div class="input-icon">🔒</div>
							<input class="auth-input" v-model.trim="password" type="password" placeholder="************" />
						</div>
						
						<div class="form-options" v-if="pageMode === 'login'">
							<label class="checkbox-label">
								<input type="checkbox" class="checkbox" />
								<span>Remember me</span>
							</label>
							<a href="#" class="forgot-link">Forgot Password?</a>
						</div>
						
						<button class="login-btn" @click="submit">
							<span class="btn-text">{{ pageMode === 'login' ? 'LOGIN' : 'REGISTER' }}</span>
							<div class="btn-arrow">→</div>
						</button>
						
						<button class="register-btn" @click="toggleMode">
							<span class="btn-text">{{ pageMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login' }}</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Rules Section -->
		<div class="rules-section">
			<h2 class="rules-title">Let's Play by the Rules!</h2>
			<p class="rules-subtitle">Baca sebentar aja, biar mainnya makin liar tanpa bingung</p>
			<div class="rules-divider"></div>
			
			<div class="rules-grid">
				<div class="rule-card">
					<div class="rule-icon">🧠</div>
					<h3 class="rule-title">Mindset Sebelum Main</h3>
					<ul class="rule-list">
						<li>Ini cuma permainan: nggak ada drama, nggak ada baper. Yang ada cuma explore, have fun, dan makin dekat sama pasangan.</li>
						<li>No shame, no fear: semua tantangan dibuat buat dinikmati bareng, bukan buat bikin insecure.</li>
					</ul>
				</div>
				
				<div class="rule-card">
					<div class="rule-icon">🎁</div>
					<h3 class="rule-title">Persiapan</h3>
					<ul class="rule-list">
						<li>Cari tempat yang nyaman + private (hotel/villa/kamar cozy).</li>
						<li>Siapin starter kit: pelumas, blindfold, musik favorit, minuman dingin, tissue. Bonus kalau ada lingerie atau kostum nakal.</li>
						<li>Mood booster: lampu temaram + playlist seksi biar makin panas.</li>
					</ul>
				</div>
				
				<div class="rule-card">
					<div class="rule-icon">🃏</div>
					<h3 class="rule-title">Cara Main</h3>
					<ul class="rule-list">
						<li>Spin kartu + biar sistem yang pilih tantangan nakal buat kalian.</li>
						<li>Jalani challenge sesuai kartu. Kalau terlalu berat? Boleh skip... tapi siap-siap ada twist dari pasangan.</li>
						<li>Ulangi spin + makin lama makin panas + sampai kalian puas.</li>
					</ul>
				</div>
				
				<div class="rule-card">
					<div class="rule-icon">❤️</div>
					<h3 class="rule-title">Tujuan Akhir</h3>
					<ul class="rule-list">
						<li>Bukan soal menang atau kalah, tapi soal berani buka batasan, eksplorasi bareng, dan nikmatin tiap detik tanpa rasa malu.</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="footer">
			<p class="footer-text">
				Wild Loov itu simple: <span class="highlight">Play. Explore. Love.</span>
			</p>
			<p class="footer-subtitle">Siap? Klik Login sekarang, dan biarin malam ini jadi milik kalian.</p>
		</div>
	</div>
</template>

<script>
export default {
	name: 'AuthPage',
	props: {
		mode: { type: String, default: 'login' }
	},
	data() {
		return { username: '', password: '', pageMode: 'login' };
	},
	created() {
		// accept mode from prop or query (?mode=login|register)
		const qMode = this.$route && this.$route.query && this.$route.query.mode;
		this.pageMode = (qMode === 'register' || qMode === 'login') ? qMode : (this.mode || 'login');
	},
	watch: { mode(newVal) { if (newVal) this.pageMode = newVal; } },
	methods: {
		submit() {
			this.$emit('submit', { username: this.username, password: this.password });
			// If used directly as a route page (no parent handler), do local auth and route
			if (!this.$attrs.onSubmit) {
				try {
					const key = 'users';
					const list = JSON.parse(localStorage.getItem(key) || '[]');
					if (this.pageMode === 'register') {
						if (list.find(u => u.username === this.username)) return;
						list.push({ username: this.username, password: this.password });
						localStorage.setItem(key, JSON.stringify(list));
						localStorage.setItem('user', JSON.stringify({ username: this.username }));
					} else {
						const match = list.find(u => u.username === this.username && u.password === this.password);
						if (!match) return;
						localStorage.setItem('user', JSON.stringify({ username: this.username }));
					}
					this.$router.push({ name: 'game' });
				} catch (e) {
					// ignore storage/router failures in production
					if (process.env.NODE_ENV !== 'production') {
						// eslint-disable-next-line no-console
						console.debug('auth submit fallback failed', e);
					}
				}
			}
		},
		guest() {
			try {
				localStorage.removeItem('user');
				localStorage.setItem('guest', '1');
				this.$emit('guest');
				this.$router.push({ name: 'game' });
			} catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.debug('guest routing failed', e);
				}
			}
		},
		toggle() {
			this.$emit('toggle-mode');
			this.pageMode = this.pageMode === 'login' ? 'register' : 'login';
		},
		toggleMode() {
			this.pageMode = this.pageMode === 'login' ? 'register' : 'login';
			// Clear form when switching modes
			this.username = '';
			this.password = '';
		}
	}
}
</script>

<style scoped>
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

.auth-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #2D1B69 0%, #4A1A7A 50%, #6B1A8B 100%);
	position: relative;
	overflow-x: hidden;
	padding: 10px;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	image-rendering: -webkit-optimize-contrast;
	image-rendering: crisp-edges;
}

/* Background Effects */
.bg-effects {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: 1;
}

.bg-blur-1 {
	position: absolute;
	top: 10%;
	right: 10%;
	width: 300px;
	height: 300px;
	background: radial-gradient(circle, rgba(255, 105, 180, 0.3) 0%, transparent 70%);
	border-radius: 50%;
	filter: blur(60px);
	animation: float 6s ease-in-out infinite;
}

.bg-blur-2 {
	position: absolute;
	bottom: 20%;
	left: 5%;
	width: 250px;
	height: 250px;
	background: radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, transparent 70%);
	border-radius: 50%;
	filter: blur(50px);
	animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
	0%, 100% { transform: translateY(0px) rotate(0deg); }
	50% { transform: translateY(-20px) rotate(5deg); }
}

/* Header */
.header {
	text-align: center;
	margin-bottom: 20px;
	position: relative;
	z-index: 2;
}

.brand {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 8px;
}

.login-logo {
	max-width: 280px;
	width: 100%;
	height: auto;
	object-fit: contain;
	image-rendering: -webkit-optimize-contrast;
	image-rendering: crisp-edges;
	image-rendering: pixelated;
	filter: contrast(1.1) brightness(1.05);
	transition: all 0.3s ease;
}

.login-logo:hover {
	transform: scale(1.02);
	filter: contrast(1.15) brightness(1.1);
}

.sublogo {
	display: flex;
	align-items: center;
	justify-content: center;
}

.logo-sublogo {
	max-width: 280px;
	width: 100%;
	height: auto;
	object-fit: contain;
	image-rendering: -webkit-optimize-contrast;
	image-rendering: crisp-edges;
	image-rendering: pixelated;
	filter: contrast(1.1) brightness(1.05);
	transition: all 0.3s ease;
}

.logo-sublogo:hover {
	transform: scale(1.02);
	filter: contrast(1.15) brightness(1.1);
}

/* Login Section */
.login-section {
	display: flex;
	justify-content: center;
	margin-bottom: 30px;
	position: relative;
	z-index: 2;
}

.login-card {
	width: min(90vw, 400px);
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(10px);
	border-radius: 20px;
	position: relative;
	overflow: hidden;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.background-image {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: linear-gradient(45deg, rgba(255, 105, 180, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%);
	z-index: 1;
}

.card-content {
	position: relative;
	z-index: 2;
	padding: 25px 20px;
}

.welcome-title {
	font-family: 'Playfair Display', serif;
	font-weight: 900;
	font-size: 28px;
	color: #2D1B69;
	text-align: center;
	margin-bottom: 15px;
	letter-spacing: 1px;
}

.intro-text {
	text-align: center;
	margin-bottom: 20px;
}

.ready-text {
	font-family: 'Inter', sans-serif;
	font-weight: 700;
	font-size: 16px;
	color: #2D1B69;
	margin-bottom: 8px;
}

.description {
	font-family: 'Inter', sans-serif;
	font-weight: 400;
	font-size: 13px;
	color: #4A1A7A;
	line-height: 1.5;
}

/* Form Styles */
.auth-form {
	display: flex;
	flex-direction: column;
	gap: 15px;
}

.input-group {
	position: relative;
	display: flex;
	align-items: center;
}

.input-icon {
	position: absolute;
	left: 15px;
	font-size: 16px;
	color: #666;
	z-index: 3;
}

.auth-input {
	width: 100%;
	padding: 12px 12px 12px 40px;
	border: 2px solid #e5e7eb;
	border-radius: 10px;
	font-family: 'Inter', sans-serif;
	font-size: 15px;
	background: white;
	transition: all 0.3s ease;
}

.auth-input:focus {
	outline: none;
	border-color: #8A2BE2;
	box-shadow: 0 0 0 3px rgba(138, 43, 226, 0.1);
}

.form-options {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 8px 0;
}

.checkbox-label {
	display: flex;
	align-items: center;
	gap: 8px;
	font-family: 'Inter', sans-serif;
	font-size: 14px;
	color: #666;
	cursor: pointer;
}

.checkbox {
	width: 16px;
	height: 16px;
}

.forgot-link {
	font-family: 'Inter', sans-serif;
	font-size: 14px;
	color: #666;
	text-decoration: none;
}

.forgot-link:hover {
	color: #8A2BE2;
}

.login-btn {
	width: 100%;
	padding: 14px;
	background: linear-gradient(90deg, #8A2BE2 0%, #FF69B4 100%);
	border: none;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 6px 15px rgba(138, 43, 226, 0.3);
}

.login-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 12px 25px rgba(138, 43, 226, 0.4);
}

.register-btn {
	width: 100%;
	padding: 12px;
	background: transparent;
	border: 2px solid rgba(138, 43, 226, 0.3);
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.3s ease;
	margin-top: 10px;
}

.register-btn:hover {
	background: rgba(138, 43, 226, 0.1);
	border-color: rgba(138, 43, 226, 0.6);
	transform: translateY(-1px);
}

.btn-text {
	font-family: 'Inter', sans-serif;
	font-weight: 600;
	font-size: 14px;
	color: #8A2BE2;
	letter-spacing: 0.5px;
}

.login-btn .btn-text {
	font-weight: 800;
	font-size: 16px;
	color: white;
	letter-spacing: 1px;
}

.btn-arrow {
	width: 30px;
	height: 30px;
	background: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	color: #8A2BE2;
	font-weight: bold;
}

/* Rules Section */
.rules-section {
	text-align: center;
	margin-bottom: 30px;
	position: relative;
	z-index: 2;
}

.rules-title {
	font-family: 'Playfair Display', serif;
	font-weight: 900;
	font-size: 28px;
	color: #FF69B4;
	margin-bottom: 10px;
	text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.rules-subtitle {
	font-family: 'Inter', sans-serif;
	font-weight: 400;
	font-size: 14px;
	color: white;
	margin-bottom: 20px;
}

.rules-divider {
	width: 150px;
	height: 2px;
	background: linear-gradient(90deg, transparent 0%, white 50%, transparent 100%);
	margin: 0 auto 25px;
	position: relative;
}

.rules-divider::before,
.rules-divider::after {
	content: '❦';
	position: absolute;
	top: -8px;
	color: white;
	font-size: 16px;
}

.rules-divider::before {
	left: 50%;
	transform: translateX(-50%);
}

.rules-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 20px;
	max-width: 1200px;
	margin: 0 auto;
}

.rule-card {
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(10px);
	border-radius: 15px;
	padding: 20px;
	text-align: left;
	border: 1px solid rgba(255, 255, 255, 0.2);
}

.rule-icon {
	font-size: 24px;
	margin-bottom: 10px;
}

.rule-title {
	font-family: 'Playfair Display', serif;
	font-weight: 700;
	font-size: 18px;
	color: #2D1B69;
	margin-bottom: 10px;
}

.rule-list {
	list-style: none;
	padding: 0;
}

.rule-list li {
	font-family: 'Inter', sans-serif;
	font-weight: 400;
	font-size: 13px;
	color: white;
	line-height: 1.5;
	margin-bottom: 8px;
	padding-left: 18px;
	position: relative;
}

.rule-list li::before {
	content: '•';
	position: absolute;
	left: 0;
	color: #FF69B4;
	font-weight: bold;
}

/* Footer */
.footer {
	text-align: center;
	position: relative;
	z-index: 2;
}

.footer-text {
	font-family: 'Inter', sans-serif;
	font-weight: 400;
	font-size: 18px;
	color: white;
	margin-bottom: 10px;
}

.highlight {
	color: #FF69B4;
	font-weight: 700;
}

.footer-subtitle {
	font-family: 'Inter', sans-serif;
	font-weight: 400;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.8);
}

/* Responsive Design */
@media (max-width: 768px) {
	.auth-page {
		padding: 8px;
	}
	
	.login-logo {
		max-width: 220px;
	}
	
	.welcome-title {
		font-size: 24px;
	}
	
	.card-content {
		padding: 20px 15px;
	}
	
	.rules-title {
		font-size: 24px;
	}
	
	.rules-grid {
		grid-template-columns: 1fr;
		gap: 15px;
	}
	
	.rule-card {
		padding: 15px;
	}
}

@media (max-width: 480px) {
	.auth-page {
		padding: 5px;
	}
	
	.login-logo {
		max-width: 180px;
	}
	
	.welcome-title {
		font-size: 22px;
	}
	
	.card-content {
		padding: 18px 12px;
	}
	
	.rules-title {
		font-size: 22px;
	}
	
	.rule-card {
		padding: 12px;
	}
}
</style>


