const jsonServer = require('json-server');
const server = jsonServer.create();
const db = require('./mock-db.json');
const cors = require('cors');
const router = jsonServer.router('mock-db.json');
const middlewares = jsonServer.defaults();
const PORT = 8080;

const corsOptions = {
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
};
server.use(cors(corsOptions));
server.use(jsonServer.bodyParser);


server.post('/login', (req, res) => {
  const user = db.users.find(user => user.email === req.body.email);
  if (user && user.password === req.body.password) {
    res.status(200).json({ user });
  }
  res.status(400).json({message: 'Wrong credentials'});
});

server.post('/add-to-basket', (req, res) => {
  const index = db.users.findIndex(user => user.email === req.body.email);
  if (index < 0) {
    res.status(400).json({message: 'Bad request'});
  }
  router.db
    .get('users')
    .get(index)
    .get('basket')
    .push(req.body.car)
    .write();

  res.status(200).json({user: router.db.get('users').get(index)})
});

server.post('/remove-from-basket', (req, res) => {
  const userIndex = db.users.findIndex(user => user.email === req.body.email);
  if (userIndex < 0) {
    res.status(400).json({message: 'Bad request'});
  }
  const carIndex = router.db
    .get('users')
    .get(userIndex)
    .get('basket')
    .findIndex(car => car.id.toString() === req.body.id.toString());

  if (carIndex < 0) {
    res.status(400).json({message: 'Bad request'});
  }

  router.db
    .get('users')
    .get(userIndex)
    .get('basket')
    .splice(carIndex, 1)
    .write();

  res.status(200).json({test: router.db.get('users').get(userIndex)});
});


server.post('/signin', (req, res) => {
  const user = db.users.find(user => user.email === req.body.email);
  if (!req.body
    || !req.body.email
    || !req.body.lastName
    || !req.body.firstName
    || !req.body.password
    || !req.body.confirmPassword) {
    res.status(400).json({message: 'Bad request'});
  }

  if (req.body.password !== req.body.confirmPassword) {
    res.status(400).json({message: 'Passwords not match'});
  }

  if (!user) {
    const newUser = {
      email: req.body.email,
      lastName: req.body.lastName,
      firstName: req.body.firstName,
      password: req.body.password,
    };
    router.db.get('users').push(newUser).write();
    res.status(200).json({message: 'User was registered success'});
  }
  res.status(400).json({message: 'User has already registered with that email'});
});

server.use(middlewares);
server.use(router);
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});

function insert(db, collection, data) {
  const table = db.get(collection);
  table.push(data).write();
}
