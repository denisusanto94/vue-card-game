<template>
	<div class="deck carddeck-app">
		<div class="controls">
			<label>
				Level:
				<select v-model.number="currentLevel" @change="onLevelChange">
					<option :value="1">1</option>
					<option :value="2">2</option>
					<option :value="3">3</option>
					<option :value="4">4</option>
				</select>
			</label>
			<button @click="shuffleUnopened">Shuffle Unopened</button>
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
						<div class="face back">🂠</div>
						<div class="face front" :style="frontStyle(card)"><span class="front-label">{{ card.label }}</span></div>
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
						<div class="face back">🂠</div>
						<div class="face front" :style="frontStyle(card)"><span class="front-label">{{ card.label }}</span></div>
					</div>
				</div>
				<div class="empty" v-if="remaining === 0">Empty</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'CardDeck',
	data() {
		return {
			unopened: [],
			opened: [],
			isOpening: false,
			flipDurationMs: 520,
			currentLevel: 1
		};
	},
	computed: {
		remaining() { return this.unopened.length; }
	},
	methods: {
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
			console.log('Card:', card);
			console.log('Image URL:', card?.image);
			if (card && card.image) {
				style.backgroundImage = `url(${card.image})`;
				style.backgroundSize = 'contain';
				style.backgroundRepeat = 'no-repeat';
				style.backgroundPosition = 'center';
				style.backgroundColor = '#f0f0f0'; // temporary to see if style applies
			} else {
				style.backgroundColor = '#ffcccc'; // red to see if style applies at all
			}
			return style;
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
			card.opened = true; // trigger in-place flip on unopened stack
			setTimeout(() => {
				// move after flip completes
				this.unopened.splice(idx, 1);
				this.opened.push(card);
				this.isOpening = false;
			}, this.flipDurationMs);
		}
	},
	mounted() {
		this.loadLevel(this.currentLevel);
	}
}
</script>

<style scoped>
</style>


