const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const cookieParser = require('./middleware/cookieParser');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
// use middleware
app.use(cookieParser);
app.use(Auth.createSession);



app.get('/',
async (req, res) => {
  const session = await models.Sessions.isLoggedIn(req.session)
  // If accessing a code that does not exist, it should redirect here with and render index -> however, session doesn't exist
  if (!session) {
    res.redirect('/login')
  } else {
    res.render('index')
  }
});

app.get('/create',
(req, res) => {
  if (models.Sessions.isLoggedIn(req.session)) {
    res.render('index')
  } else {
    res.redirect('/login')
  }
});

app.get('/links',
(req, res, next) => {
  if (models.Sessions.isLoggedIn(req.session)) {
    models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
  } else {
    res.redirect('/login')
  }
});

app.post('/links',
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// SIGN UP
app.get('/signup',
  (req, res) => {
    res.render('signup');
  });

app.post('/signup', async (req, res) => {

  const user = await models.Users.get({ username: req.body.username })
  if (user) return res.redirect('/signup')

  const newUser = await models.Users.create(req.body)
    .catch((error) => res.status(404).send(error))
  const updated = await models.Sessions.update({ hash: req.session.hash }, { userId: newUser.insertId })
  res.redirect('/')

})

// LOGIN
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  try {
    const user = await models.Users.get({ username: req.body.username})
    if (!user || !models.Users.compare(req.body.password, user.password, user.salt)) throw new Error('Not authenticated')

    await models.Sessions.update({ hash: req.session.hash }, { userId: user.id })
    res.redirect('/')

  } catch (error) {
      res.redirect('/login')
  }
})

// LOGOUT
app.get('/logout', async (req, res) => {
  try {
    const hash = req.session.hash
    const logout = await models.Sessions.delete({ hash: hash })
    res.cookie('shortlyid', null)

    res.redirect('/login')
  } catch (error) {
    console.error(error)
  }
})

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', async (req, res, next) => {
  // const link = await models.Links.get({ code: req.params.code })

  // if (!link) {
  //   return res.redirect('/')
  // }

  // const click = await models.Clicks.create({ linkId: link.id })

  // const update = await models.Links.update(link, { visits: link.visits + 1 })
  // res.redirect(link.url)
  // console.log(update)
  return models.Links.get({ code: req.params.code })
    .tap(link => {
      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
