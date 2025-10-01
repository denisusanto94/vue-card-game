<template>
	<div class="auth-page">
		<div class="auth-card">
			<div class="brand">
				<img class="logo" src="../assets/logo.png" alt="logo" />
				<div class="brand-text">Card Deck</div>
			</div>
			<div class="auth-title">{{ pageMode === 'login' ? 'Masuk' : 'Daftar' }}</div>
			<p class="subtitle" v-if="pageMode==='login'">Selamat datang kembali! Masuk untuk melanjutkan permainan.</p>
			<p class="subtitle" v-else>Buat akun baru untuk membuka semua level hingga level 4.</p>
			<div class="auth-form">
				<input class="auth-input" v-model.trim="username" placeholder="Username" />
				<input class="auth-input" v-model.trim="password" type="password" placeholder="Password" />
				<button class="btn" @click="submit">{{ pageMode === 'login' ? 'Masuk' : 'Daftar' }}</button>
				<button class="btn alt" @click="toggle">{{ pageMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login' }}</button>
				<button class="btn muted" @click="guest">Lanjut sebagai Tamu</button>
			</div>
			<p class="note">Mode tamu hanya dapat bermain sampai level 2.</p>
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
		}
	}
}
</script>

<style scoped>
.auth-page { position: fixed; inset: 0; display: grid; place-items: center; padding: 16px; background: linear-gradient(135deg, #7c3aed 0%, #ef4444 100%); }
.auth-card { width: min(92vw, 420px); background: #ffffff; border-radius: 14px; padding: 26px 24px; box-shadow: none; display: grid; gap: 14px; }
.brand { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 2px; }
.brand .logo { width: 40px; height: 40px; }
.brand .brand-text { font-weight: 900; font-size: 20px; letter-spacing: .5px; color: #0f172a; }
.auth-title { font-weight: 800; font-size: 24px; letter-spacing: .4px; color: #0f172a; text-align: center; margin: 2px 0 6px; }
.subtitle { text-align: center; color: #334155; margin: -2px 0 10px; font-size: 14px; }
.auth-form { display: grid; gap: 14px; }
.auth-input { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 10px; border: 1px solid #e5e7eb; font-size: 15px; background: #fff; }
.auth-input:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
.auth-card .btn { width: 100%; padding: 12px 14px; border-radius: 10px; border: none; background: #111827; color: #fff; font-weight: 700; letter-spacing: .3px; box-shadow: none; }
.auth-card .btn:hover { filter: brightness(1.05); }
.auth-card .btn.alt { background: #4b5563; }
.auth-card .btn.muted { background: #9ca3af; color: #111827; }
.note { color: #475569; text-align: center; font-size: 12px; margin-top: 6px; }

@media (max-width: 420px) {
	.auth-card { padding: 22px 18px; gap: 12px; }
}
</style>


