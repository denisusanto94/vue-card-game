import { createRouter, createWebHashHistory } from 'vue-router';
import AuthPage from '../components/AuthPage.vue';
import CardDeck from '../components/CardDeck.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: AuthPage },
  { path: '/game', name: 'game', component: CardDeck }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isGuest = localStorage.getItem('guest') === '1';
  if (to.name === 'game' && !(user || isGuest)) {
    next({ name: 'login' });
  } else if (to.name === 'login' && (user || isGuest)) {
    next({ name: 'game' });
  } else {
    next();
  }
});

export default router;


