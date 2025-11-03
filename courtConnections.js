import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { DB_DATABASE, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT} from './config.js'
export class courtConnections {
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

    async createCourt(court) {
        //const id = uuidv4();
        //console.log(id);

        const query = 'INSERT INTO court (id, num, sport, description, players_num, price_per_hour) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const values = [id, court.num || 1, court.sport, court.description, court.players_num, court.price_per_hour]

        try {
            const res = await this.pool.query(query, values);
            return res.rows[0];
        } catch (err) {
            console.error('Error creating court:', err);
            
            // Verifica si el error es de duplicidad
            if (err.code === '23505') {
                // Lanza un error con un mensaje específico para el cliente
                throw new Error('id already exists.');
            } else {
                // Lanza otros errores sin cambiar el mensaje
                throw err;
            }
        }
    }

    async getCourts() {
        const query = 'SELECT * FROM court';
        try {
            const res = await this.pool.query(query);
            return res.rows;
        } catch (error) {
            console.error('Error fetching courts:', error);
            throw error;
        }  
    }

    async getCourtById(court_id) {
        const query = 'SELECT * FROM court WHERE id = $1';
        const values = [court_id];
        try {
            const res = await this.pool.query(query, values);
            return res.rows[0];
        } catch (error) {
            console.error('Error fetching court by ID:', error);
            throw error;
        }
    }

    async getCourtBySport(sport) {
        const query = 'SELECT * FROM court WHERE sport = $1';
        const values = [sport];
        try {
            const res = await this.pool.query(query, values);
            return res.rows;
        }
        catch (error) {
            console.error('Error fetching courts by sport:', error);
            throw error;
        }
    }


    async getCourtId(sport, num) {
        const query = 'SELECT id FROM court WHERE sport = $1 AND num = $2';
        const values = [sport, num];
        try {
            const res = await this.pool.query(query, values);
            return res.rows[0] ? res.rows[0].id : null;
        } catch (error) {
            console.error('Error fetching court ID:', error);
            throw error;
        }
    }

}


/*// Code for prooving courtConnections
const prueba = new courtConnections();
const court = await prueba.getCourtById('7a87a101-47c0-450a-9869-fbb7733857ba');
console.log(court);
await prueba.close();
*/