<script setup lang="ts">
import {ref,onMounted} from 'vue';import {saveProfile,type Profile} from '../../domain/profile/profile';
defineProps<{demo?:boolean}>();
const emit=defineEmits<{join:[profile:Profile]}>();const name=ref(''),error=ref(''),input=ref<HTMLInputElement>();
onMounted(()=>input.value?.focus());
function submit(){try{const profile=saveProfile(localStorage,name.value);emit('join',profile);}catch(e){error.value=(e as Error).message;}}
</script>
<template><div class="join-overlay"><section class="join-card" role="dialog" aria-modal="true" aria-labelledby="join-title"><div class="trail-stamp">山</div><span class="eyebrow">欢迎来到西湖群山</span><h2 id="join-title">给山野里的你，<br>起个名字。</h2><p>一条山路，一群同行的人。<br>你的第一步，从老和云起开始。</p><form @submit.prevent="submit"><label for="nickname">你的昵称</label><input ref="input" id="nickname" v-model="name" placeholder="例如：追风的小鹿" maxlength="24" autocomplete="nickname" :aria-invalid="!!error" aria-describedby="join-error"/><p v-if="error" id="join-error" role="alert" class="form-error">{{ error }}</p><button class="start" type="submit">创建我的徒步身份</button></form><small>{{ demo?'当前为模拟山友演示，不向在线山友分享状态。':'在线山友可以看见你的昵称、虚拟位置、累计行走时间和里程。' }}无需密码，昵称身份和个人进度保存在此浏览器；清除浏览器数据后需重新创建。</small></section></div></template>

