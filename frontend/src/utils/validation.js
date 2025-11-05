
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  return password.length >= 6
}

export const validateUsername = (username) => {
  return username.length >= 3
}

export const validateMessage = (message) => {
  return message.trim().length > 0 && message.length <= 5000
}