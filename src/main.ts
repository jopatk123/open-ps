import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app/App.vue';
import './ui/theme/tokens.css';
import './ui/theme/base.css';

createApp(App).use(createPinia()).mount('#app');
