import { Pool } from 'pg';
import { DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT } from './config.js'
import { v4 as uuidv4 } from 'uuid';

export default class Reservation {
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

    async createReservation(data) {
        const id = uuidv4();
        const query = 'INSERT INTO court_reservation(id, court_id, user_email, total_time, total_price, hour, day, status) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
        const values = [id, data.court_id, data.user_email, data.total_time, data.total_price, data.hour, data.day, "pendiente"];
        try {
            const res = await this.pool.query(query, values);
            return res.rows[0];
        } catch (error) {
            console.error('Error creating reservation:', error);
            throw error;
        }
    }

    async getReservationsByUser(user_email){
        const query = `SELECT * FROM court_reservation WHERE user_email = $1`
        const value = [user_email]
        try {
            const res = await this.pool.query(query, value);
            return res.rows;
        } catch (error) {
            console.error('Error creating reservation:', error);
            throw error;
        }
    }

    async getHoursByReservationDay(day, court_id){
        const query = `SELECT hour FROM court_reservation WHERE day = $1 AND court_id = $2`;
        const value = [day, court_id];
        try {
            const res = await this.pool.query(query, value);
            return res.rows;
        } catch (error) {
            console.error('Error fetching reservations by day:', error);
            throw error;
        }   
    }

    async getAllReservations(){
        const query = `SELECT * FROM court_reservation`;
        try {
            const res = await this.pool.query(query);
            return res.rows;
        } catch (error) {
            console.error('Error fetching all reservations:', error);
            throw error;
        }
    }

}


/*//Code for prooving class
const reservation = new Reservation();
//const variable = await reservation.createReservation({id: '5', field_id: 1, user_id: 1, total_time: 1, total_price: 1, hour: '1:00:00'});
const variable = await reservation.getAllReservations();
console.log('reservacion guardada en variable: ', variable);
await reservation.close();
*/