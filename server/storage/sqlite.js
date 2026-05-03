import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'santis.db');

const db = new sqlite3.Database(DB_PATH,(err)=>{
    if(err){
        console.error("DB CONNECT ERROR",err);
        return;
    }
    console.log("🧠 Santis Event Store Connected");
});

/* PRAGMA CONFIG & SCHEMA INIT */
db.serialize(()=>{
    db.run(`PRAGMA journal_mode = WAL`);
    db.run(`PRAGMA foreign_keys = ON`);
    db.run(`PRAGMA busy_timeout = 5000`);
    db.run(`PRAGMA synchronous = NORMAL`);
    
    // Create Tables for Zero-Clash Scheduler
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS therapists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      expertise TEXT NOT NULL,
      status TEXT DEFAULT 'active'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      buffer_minutes INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      room_id INTEGER NOT NULL,
      therapist_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      start_time TEXT NOT NULL, 
      end_time TEXT NOT NULL,
      buffer_end_time TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed',
      FOREIGN KEY(room_id) REFERENCES rooms(id),
      FOREIGN KEY(therapist_id) REFERENCES therapists(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    )`);
    
    // Seed Data Initialization
    db.get("SELECT count(*) as count FROM rooms", (err, row) => {
        if (!err && row && row.count === 0) {
            console.log("🌱 [Sovereign OS] Seed verileri (Odalar, Terapistler, Hizmetler) SQLite'a yükleniyor...");
            
            const insertRoom = db.prepare("INSERT INTO rooms (name, type) VALUES (?, ?)");
            insertRoom.run("Sultan Hamamı", "hamam");
            insertRoom.run("VIP Masaj Odası", "massage");
            insertRoom.finalize();

            const insertTherapist = db.prepare("INSERT INTO therapists (name, expertise) VALUES (?, ?)");
            insertTherapist.run("Aylin", "Bali & İsveç");
            insertTherapist.run("Made", "Bali Uzmanı");
            insertTherapist.finalize();

            const insertService = db.prepare("INSERT INTO services (name, duration_minutes, buffer_minutes) VALUES (?, ?, ?)");
            insertService.run("Geleneksel Bali Masajı", 60, 15);
            insertService.run("Kraliyet Hamam Ritüeli", 45, 30);
            insertService.finalize();
        }
    });
});

export default db;
