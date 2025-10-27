import { boot } from 'quasar/wrappers'
// import { validateToken } from 'src/composables/validate_token'
import { useAuthStore } from 'src/stores/authStore'
import { api } from './axios'

// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ router, store }) => {
  const authStore = useAuthStore(store)
  router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some((x) => x.meta.requiresAuth)
    var token = null
    token = authStore.token_id
    if (to.path === '/authenticate' && token) {
      next('/')
    } else if (requiresAuth && !token) {
      next('/authenticate')
    } else {
      api.defaults.headers.common.Authorization = 'Bearer ' + token
      next()
    }
  })
})
