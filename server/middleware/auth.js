const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = async (req, res, next) => {

  try {
    if (!Object.keys(req.cookies).length) {
      throw new Error('No cookie')
    }
    const session = await models.Sessions.get({ hash: req.cookies['shortlyid'] })
    if (!session) {
      throw new Error('No session')
    }
    req.session = session
    next()

  } catch(error) {

    const newSession = await models.Sessions.create()
    const getCreated = await models.Sessions.get({ id: newSession.insertId })
    req.session = getCreated
    res.cookie('shortlyid', getCreated.hash)
    next()
  }

  // // if req.cookies exist
  // if (Object.keys(req.cookies).length) {
  //   try {
  //     const session = await models.Sessions.get({ hash: req.cookies['shortlyid'] })
  //     if (!session) {
  //       await sessionCreate()
  //       return next()
  //     }
  //     req.session = session
  //     // if (!session.userId) {
  //     //   return next()
  //     // }
  //     // const user = await models.Users.get({ id: session.userId })
  //     // req.session.user['username'] = user.username
  //     next()
  //   } catch (error) {
  //     console.error(error)
  //   }
  // } else {
  //   try {
  //     await sessionCreate()
  //     next()
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }
}

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

