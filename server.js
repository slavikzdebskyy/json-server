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


//* Login
// @params body: { "email" : string, "password" : string }
//
// @example: {
//             "email" : "example@mail.com",
//             "password" : "qwerty123"
//           }
// */
server.post('/login', (req, res) => {
  const user = db.users.find(user => user.email === req.body.email);
  if (user && user.password === req.body.password) {
    res.status(200).json({ user });
  }
  res.status(400).json({message: 'Wrong credentials'});
});


//* Registration user
// @params body: {
//                "email" : string,
//                "firstName" : string,
//                "lastName" : string,
//                "password" : string,
//                "confirmPassword" : string
//                }
// @example: {
//                "email" : "example@mail.com",
//                "firstName" : "David",
//                "lastName" : "Nelson",
//                "password" : "password123",
//                "confirmPassword" : "password123"
//                }
// */
server.post('/signin', (req, res) => {
  const user = db.users.find(user => user.email === req.body.email);

  if (user) {
    return res.status(400).json({message: 'User has already registered with that email'});
  }

  if (!req.body
    || !req.body.email
    || !req.body.lastName
    || !req.body.firstName
    || !req.body.password
    || !req.body.confirmPassword) {
    return res.status(400).json({message: 'Bad request'});
  }

  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({message: 'Passwords not match'});
  }

  const newUser = {
    email: req.body.email,
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    password: req.body.password,
    basket: [],
  };
  router.db.get('users').push(newUser).write();
  return res.status(200).json({message: 'User was registered success'});
});


//* Add gods to basket
// @params body: {email : string, your_field : object, quantity?: number }
// @example: {
//            "email" : "example@mail.com",
//            "your_field" :  {
//                             "id": 123456,
//                             "brand": "Audi"
//                            },
//            "quantity": 1,
//           }
// */
server.post('/add-to-basket', (req, res) => {
  try {
    const index = db.users.findIndex(user => user.email === req.body.email);

    if (index < 0) {
      return res.status(400).json({message: 'Bad request'});
    }
    const basket = [...router.db.get('users').get(index).get('basket')];
    const length = basket.length;
    const quantity = req.body.quantity || 1;
    const indx = basket.findIndex(item => item.your_field.id === req.body.your_field.id); // you should change property "your_field" to your field name

    if (indx >= 0) {
      basket[indx].quantity += quantity;
    } else {
      basket.push({your_field: req.body.your_field, quantity}); // you should change property "your_field" to your field name
    }

    router.db.get('users').get(index).get('basket').splice(0,length).write();
    router.db.get('users').get(index).get('basket').push(...basket).write();

    return res.status(200).json({basket: router.db.get('users').get(index).get('basket')})
  } catch(error) {
    return res.status(500).json({error})
  }
});


//* Remove gods to basket
// @params body: {email : string, your_field_id : string | number, quantity?: number}
// @example: {
//            "email" : "example@mail.com",
//            "your_field_id" :  12345,
//            "quantity": 1,
//           }
// */
server.post('/remove-from-basket', (req, res) => {
  try {
    const userIndex = db.users.findIndex(user => user.email === req.body.email);
    if (userIndex < 0) {
      return res.status(400).json({message: 'Bad request'});
    }

    const basket = [...router.db.get('users').get(userIndex).get('basket')];
    const length = basket.length;
    const quantity = req.body.quantity || 1;
    const index = basket.findIndex(item => item.your_field.id.toString() === req.body.your_field_id.toString()); // you should change property "your_field" to your field id name

    if (index < 0) {
      return res.status(400).json({message: 'Bad request'});
    }

    if (basket[index].quantity <= quantity) {
      basket.splice(index, 1);
    } else {
      basket[index].quantity -= quantity;
    }

    router.db.get('users').get(userIndex).get('basket').splice(0, length).write();
    router.db.get('users').get(userIndex).get('basket').push(...basket).write();

    return res.status(200).json({basket: router.db.get('users').get(userIndex).get('basket')});
  } catch(error) {
    return res.status(500).json({error})
  }
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
