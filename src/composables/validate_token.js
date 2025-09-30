import moment from 'moment'
import { api } from 'boot/axios'

export function validateToken(token, expireAt) {
  const time = new Date().getTime()
  let expiry = moment(expireAt, 'YYYY-MM-DD HH:mm:ss').format('X') * 1000
  if (!token || !expireAt) {
    return false
  }
  if (time < expiry) {
    api.defaults.headers.common.Authorization = 'Bearer ' + token
    return true
  } else {
    api.defaults.headers.common.Authorization = ''
    return false
  }
}
