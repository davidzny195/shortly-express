const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = async (req, res, next) => {

  const sessionCreate = async () => {
    const newSession = await models.Sessions.create()
    const getCreated = await models.Sessions.get({ id: newSession.insertId })
    req.session = getCreated
    res.cookie('shortlyid', getCreated.hash)
  }

  // if req.cookies exist
  if (Object.keys(req.cookies).length) {
    try {
      const session = await models.Sessions.get({ hash: req.cookies['shortlyid'] })

      if (!session) {
        await sessionCreate()
        return next()
      }

      req.session = session
      res.cookie('shortlyid', session.hash);

      if (!session.userId) {
        return next()
      }

      const user = await models.Users.get({ id: session.userId })
      req.session.user['username'] = user.username
      next()



    } catch (error) {
      console.error(error)
    }

  } else {
    try {
      await sessionCreate()
      req.session.user = { username: req.body.username }
      const user = await models.Users.get({ username: req.body.username })
      if (user && user.id) {
        req.session.userId = user.id
      }
      next()
    } catch (error) {
      console.error(error)
    }
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

