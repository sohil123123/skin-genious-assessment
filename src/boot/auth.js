import { boot } from 'quasar/wrappers'
import { validateToken } from 'src/composables/validate_token'
import { useAuthStore } from 'src/stores/authStore'

// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ router, store }) => {
  const authStore = useAuthStore(store)
  router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some((x) => x.meta.requiresAuth)
    var token = null
    var expireAt = null
    token = authStore.bearer?.access_token
    expireAt = authStore.bearer?.expires_at
    if (requiresAuth && (!authStore.user || !validateToken(token, expireAt))) {
      next('/authenticate')
    } else if (
      requiresAuth &&
      authStore.user &&
      validateToken(token, expireAt) &&
      to.path === '/authenticate'
    ) {
      next('/')
    }
    next()
  })
})
