import { boot } from 'quasar/wrappers'
import { useAuthStore } from 'src/stores/authStore'
import { api } from './axios'

export default boot(async ({ router, store }) => {
  const authStore = useAuthStore(store)

  router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some((x) => x.meta.requiresAuth)
    let token = authStore.token_id

    // ✅ If user is trying to re-authenticate
    if (to.path === '/authenticate') {
      // Clear all stored user/session data
      localStorage.removeItem('token_id')

      // Reset Pinia auth store if needed
      authStore.$reset?.()

      // Optionally clear Axios header
      delete api.defaults.headers.common.Authorization

      // Allow navigation to /authenticate (login page)
      return next()
    }

    // ✅ If route requires authentication but token missing → redirect
    if (requiresAuth && !token) {
      // return next('/authenticate')
    }

    // ✅ If token exists, set Axios header
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`
    }

    next()
  })
})
