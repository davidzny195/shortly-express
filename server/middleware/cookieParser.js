const parseCookies = (req, res, next) => {
  const cookies = req.headers.cookie

  let parsed = {}
  if (cookies) {
    const splitCookies = cookies.split(';')
    for (let cookie of splitCookies) {
      let cookieKeyValue = cookie.split('=')
      parsed[cookieKeyValue[0].trim()] = cookieKeyValue[1]
    }
  }
  req.cookies = parsed
  next()
};

module.exports = parseCookies;