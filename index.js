import express/* { response } */ from 'express';
import { PORT, HOST, JWT_SECRET } from './config.js';
import { UserConnections } from './userConnections.js'; 
import { courtConnections } from './courtConnections.js'
import Reservation from './reservations.js'
import cors from 'cors';
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser';
//import crypto from 'crypto';
//import bcrypt from 'bcrypt';

const userConnect = new UserConnections();
const courtConnect = new courtConnections();
const reserv = new Reservation();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Cambia al puerto de tu frontend si es diferente
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  const token = req.cookies['access_token'];
  //console.log('middleware')
  req.session = { user: null };

  try {
    const data = jwt.verify(token, JWT_SECRET);
    
    req.session.user = {
      email: data.email,
      name: data.name,
      lastname: data.lastname,
      phone: data.phone, 
      role: data.role,
      points: data.points
    };
    
  } catch (error) {
    if (token) {
      console.log('Token error:', error.message);
    }
  }
  next();
});

app.get('/', (req, res) => {
  const token = req.cookies['access_token'];
  if (token) {
    try {
      const data = jwt.verify(token, JWT_SECRET);
      res.json({
        isAuthenticated: true,
        user: {
          email: data.email,
          name: data.name,
          lastname: data.lastname,
          phone: data.number || data.phone, // Maneja ambos casos
          role: data.role,
          points: data.points,
        },
        cookieInfo: {
          received: true,
          tokenPreview: token.substring(0, 50) + '...' // Para debug
        }
      });
    } catch (error) {
      console.log('Token inválido o expirado', error);
      res.json({
        isAuthenticated: false,
        error: 'Token inválido',
        cookieInfo: {
          received: true,
          invalid: true
        }
      });
    }
  } else {
    res.json({
      isAuthenticated: false,
      cookieInfo: {
        received: false,
        message: 'No se recibió access_token'
      }
    });
  }
});

app.post('/register', async (req, res) => {
    const user = req.body;
    try {
        // La ejecución espera a que createUser termine
      const newUser = await userConnect.createUser(user); 
      console.log('New user created:', newUser);

      // Genera el token JWT con la información del usuario
      const token = jwt.sign(
      { email: user.email, name:user.name, lastname: user.lastname, phone: user.phone, role: user.role, points: user.points }, 
      JWT_SECRET,
      {expiresIn: '1h'}
      );
      res.cookie('access_token', token,{
        httpOnly: true,
      })
      .send({ user, token })
    } catch (error) {
        // Si createUser lanza un error, la ejecución llega aquí
        console.error('Error creating user:', error);

        // Si el error es una violación de unicidad (correo duplicado)
        if (error.message === 'User with this email already exists.') {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await userConnect.loginUser(email, password);
    
    // Accede a los datos correctamente
    const userData = result.user;
    const token = jwt.sign(
      { 
        email: userData.email,       // ← userData en lugar de user
        name: userData.name,         // ← userData.name
        lastname: userData.lastname, // ← userData.lastname
        phone: userData.phone, // ← userData.phone
        role: userData.role ,
        points: userData.points,
      }, 
      JWT_SECRET,
      { expiresIn: '1h' }
    );


    res
      .cookie('access_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000
      })
      .json({ 
        isAuthenticated: true,
        user: {
          email: userData.email,     
          name: userData.name,
          lastname: userData.lastname,
          phone: userData.phone,
          role: userData.role,
          points: userData.points,
        },
        message: 'Login exitoso'
      });
      
  } catch (error) {
    console.error('Error:', error);
    res.status(401).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/logout', (req, res) => {
  const token = req.cookies['access_token'];
  if (token) {
    try {
      const data = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.log('Token inválido o expirado', err);
    }
  } else {
    console.log('No se recibió access_token');
  }

  res.clearCookie('access_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false // Cambia a true si usas HTTPS en producción
  });
  res.json({ message: 'Sesión cerrada correctamente' });
});

app.post('/get_user_by_email', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await userConnect.getUserByEmail(email);
    if (result) {
      res.json(result); // Devuelve el objeto completo del usuario
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Hubo un error en el servidor.' });
  }
});

app.post('/create_court', async (req,res) => {
  
  const court = req.body;
  //console.log ('court in create court:' , court)
  try {
    const result = await courtConnect.createCourt(court);
    res.json('funcionó joyita bb');
  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'Hubo un error en el servidor.' }); // Es buena práctica enviar un status de error
  }
});

app.post('/create_reservation', async (req, res) => {
    const reservation = req.body;
    console.log('reservation backend:', reservation);
    try {
      const result = await reserv.createReservation(reservation);
      res.json(result);
    }
    catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Hubo un error en el servidor.' });
    }

});

app.get('/get_courts', async (req,res) => {
  try {
    const result = await courtConnect.getCourts();
    res.json(result);
  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'Hubo un error en el servidor.' });
  }
});

app.post('/get_court_by_id', async (req,res) => {
  const { court_id } = req.body;
  try {
    const result = await courtConnect.getCourtById(court_id);
    res.json(result);
  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'Hubo un error en el servidor.' });
  }
});

app.post('/get_courts_by_sport', async (req,res) => {
  const { sport } = req.body;
  try {
    const result = await courtConnect.getCourtBySport(sport);
    res.json(result);
  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'Hubo un error en el servidor.' }); 
  }
});

app.post('/get_hours', async (req,res) => {
  //console.log('get hours backend')
  const day = req.body.day;
  const court_id = req.body.court_id;
  try { 
    const result = await reserv.getHoursByReservationDay(day, court_id);
    res.json(result);
  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'Hubo un error en el servidor.' });
  }
});

app.post('/user-reservations', async (req, res) => {
  const user_email = req.body.email;
  try {
    const result = await reserv.getReservationsByUser(user_email);
    res.json(result);
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Hubo un error en el servidor.' });
  } 
});

app.get('/get-all-reservations', async (req, res) => {
  console.log('get all reservations backend')
  try {
    const result = await reserv.getAllReservations();
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Hubo un error en el servidor.' });
  };
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
})