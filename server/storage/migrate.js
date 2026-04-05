const fs = require('fs');
const path = require('path');
const db = require('./sqlite');

const MIGRATIONS = path.join(__dirname,'migrations');

function runMigrations(){
    const files = fs.readdirSync(MIGRATIONS).sort();

    files.forEach(file => {
        const sql = fs.readFileSync(path.join(MIGRATIONS,file), 'utf8');

        db.exec(sql,(err)=>{
            if(err){
                console.error("Migration failed:", file, err);
            } else {
                console.log("✓ Migration applied:", file);
            }
        });
    });
}

runMigrations();
