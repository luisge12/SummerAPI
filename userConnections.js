import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT, SALT_ROUNDS } from './config.js'


export class UserConnections {
    constructor() {
        this.pool = new Pool({
            user: DB_USER,
            host: DB_HOST,
            database: DB_DATABASE,
            password: DB_PASSWORD,
            port: parseInt(DB_PORT, 10),
        });
    }
    async close() {
        await this.pool.end();
    }

    async createUser(user) {
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

        const query = 'INSERT INTO users (email, name, lastname, birthdate, password, phone, points) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const values = [user.email, user.name, user.lastname, user.birthdate, hashedPassword, user.phone, 0];

        try {
            const res = await this.pool.query(query, values);
            return res.rows[0];
        } catch (err) {
            console.error('Error creating user:', err);
            
            // Verifica si el error es de duplicidad
            if (err.code === '23505') {
                // Lanza un error con un mensaje específico para el cliente
                throw new Error('User with this email already exists.');
            } else {
                // Lanza otros errores sin cambiar el mensaje
                throw err;
            }
        }
    }

    async loginUser(email, password) {
        
        const query = 'SELECT * FROM users WHERE email = $1';
        const values = [email];
        try {
            const res = await this.pool.query(query, values);
            if (res.rows.length === 0) {
                throw new Error('User not found');
            }
            const hashedPassword = res.rows[0].password;
            const match = await bcrypt.compare(password, hashedPassword);
            if (!match) {
                throw new Error('Invalid password');
            }
            return {user: res.rows[0]};
        } catch (err) {
            console.error('Error logging in user:', err);
            throw err;
        }
    }

    async getUserByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const values = [email];
        try {
            const res = await this.pool.query(query, values);
            if (res.rows.length === 0) {
                throw new Error('User not found');
            }
            return res.rows[0];
        }
        catch (err) {
            console.error('Error fetching user by email:', err);
            throw err;
        }
    }

    async deleteUserPoints(email, points) {
        const query = 'UPDATE users SET points = points - $1 WHERE email = $2 RETURNING *';
        const values = [points, email];
        try {
            const res = await this.pool.query(query, values);
            return res.rows[0];
        } catch (err) {
            console.error('Error deleting user points:', err);
            throw err;
        }
    }
}

/* //CODIGO PARA PROBAR LAS CONEXIONES
const prueba = new UserConnections();
let user;
try {
    user = await prueba.loginUser('luisge1299@gmail.com', '1234');
} catch (error) {
    console.error('Login failed:', error);
}

user.user.birthdate = user.user.birthdate.toISOString().substring(0, 10);
console.log(user)
prueba.close();

*/