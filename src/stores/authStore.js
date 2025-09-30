import { defineStore } from 'pinia'
import { Loading, LocalStorage, Notify } from 'quasar'
import { api } from 'src/boot/axios'

let token_id = LocalStorage.getItem('token_id') ? LocalStorage.getItem('token_id') : null
let bearer = LocalStorage.getItem('bearer') ? LocalStorage.getItem('bearer') : null
let user = LocalStorage.getItem('user') ? JSON.parse(LocalStorage.getItem('user')) : null

export const useAuthStore = defineStore('backend_auth', {
  state: () => ({
    user: user,
    bearer: bearer,
    token_id: token_id,
    expireAt: null,
    serverError: null,
    loginData: {
      email: null,
      password: null,
    },
    initinalLoginData: {
      email: null,
      password: null,
    },
  }),
  getters: {
    isServeError: (state) => {
      return state.serverError ? true : false
    },
  },
  actions: {
    login() {
      this.resetServerError()
      Loading.show()
      api
        .post('login', this.loginData)
        .then((response) => {
          this.setUserData(response)
          Notify.create({
            type: 'positive',
            message: response.data.message,
          })
          this.pushWithPromise(this.router, '/')
            .then(() => {
              this.resetAction()
            })
            .catch((e) => {
              console.log(e)
            })
        })
        .catch((e) => {
          Loading.hide()
          console.log(e)
          this.serverError = e.response.data.message
        })
    },
    setUserData(response) {
      Loading.hide()
      this.user = response.data.results.user
      LocalStorage.set('user', JSON.stringify(response.data.results.user))
      this.bearer = {
        access_token: response.data.results.access_token,
        expires_at: response.data.results.expires_at,
      }
      LocalStorage.set('bearer', this.bearer)
      this.setTokenInApi(response.data.results.access_token)
    },
    setTokenInApi(payload) {
      api.defaults.headers.common.Authorization = 'Bearer ' + payload
    },
    resetAction() {
      Object.assign(this.loginData, { ...this.initinalLoginData })
    },
    resetServerError() {
      this.serverError = null
    },
    logout() {
      api
        .get('logout', this.loginData)
        .then((response) => {
          this.resetAction()
          LocalStorage.clear()
          Notify.create({
            type: 'positive',
            message: response.data.message,
          })
          this.pushWithPromise(this.router, '/login')
            .then(() => {
              this.resetAction()
            })
            .catch((e) => {
              console.log(e)
            })
        })
        .catch((e) => {
          Loading.hide()
          console.log(e)
          this.serverError = e.response.data.message
        })
    },
    pushWithPromise(router, location) {
      return new Promise((resolve, reject) => {
        router.push(
          location,
          () => {
            resolve() // Navigation completed successfully
          },
          (err) => {
            reject(err) // Navigation failed with an error
          },
        )
      })
    },
  },
})
