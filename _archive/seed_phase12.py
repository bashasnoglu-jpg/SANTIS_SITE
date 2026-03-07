"""Santis Phase 12: Data Hydration — Final Clean Seed"""
import sqlite3, random, uuid
from datetime import datetime, timedelta

def uid():
    return str(uuid.uuid4()).replace('-','')[:32]

def now():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

c = sqlite3.connect('santis.db')
TENANT = '373b8999d83340ef9dd1eef5ecb37d69'

# STAFF
c.execute("DELETE FROM staff WHERE tenant_id=?", (TENANT,))
staff_list = [
    ("Ayşe Kaya","Senior Therapist",0.18),("Mehmet Demir","Hammam Ustası",0.15),
    ("Zeynep Çelik","Cilt Uzmanı",0.20),("Ali Yılmaz","Masaj Terapisti",0.15),
    ("Fatma Arslan","Aromaterapi Uzm.",0.17),("Can Öztürk","Masaj Terapisti",0.15),
    ("Selin Koç","Ritüel Uzmanı",0.18),("Emre Şahin","Hammam Ustası",0.15),
]
for nm,rl,cm in staff_list:
    c.execute("INSERT INTO staff(id,tenant_id,name,role,is_active,commission_rate,created_at) VALUES(?,?,?,?,1,?,?)",
              (uid(),TENANT,nm,rl,cm,now()))
print(f"✅ {len(staff_list)} staff")

# ROOMS
c.execute("DELETE FROM rooms WHERE tenant_id=?", (TENANT,))
rooms_list = [
    ("Hammam – Ana Kubbe",20),("Hammam – VIP Suit",4),("Masaj – Odası 1",2),
    ("Masaj – Odası 2",2),("Masaj – Çift Oda",4),("Cilt Bakım – A",2),
    ("Cilt Bakım – B",2),("Ritüel Salonu",6),("Hammam – Çocuk",8),("Relax Lounge",10),
]
for nm,cp in rooms_list:
    c.execute("INSERT INTO rooms(id,tenant_id,name,capacity,is_active,created_at) VALUES(?,?,?,?,1,?)",
              (uid(),TENANT,nm,cp,now()))
print(f"✅ {len(rooms_list)} rooms")

# SERVICES
c.execute("DELETE FROM services WHERE tenant_id=?", (TENANT,))
svc_list = [
    ("Klasik Hammam",60,85.0),("VIP Hammam Ritüeli",90,150.0),
    ("Aromaterapi Masajı",60,95.0),("Taş Masajı",75,120.0),
    ("Derin Doku Masajı",60,95.0),("Cilt Bakımı (Sothys)",75,110.0),
    ("Anti-Aging Ritüeli",90,175.0),("Çift Masaj",60,170.0),
    ("Çocuk Hammam",45,55.0),("Detoks Ritüeli",120,220.0),
    ("Ayurveda Masajı",90,145.0),("Gelinlik Paketi",180,380.0),
]
for nm,dur,pr in svc_list:
    c.execute(
        "INSERT INTO services(id,tenant_id,name,duration_minutes,price,currency,current_price_eur,min_price_eur,max_price_eur,demand_multiplier,is_active,created_at,is_deleted) VALUES(?,?,?,?,?,'EUR',?,?,?,1.0,1,?,0)",
        (uid(),TENANT,nm,dur,pr,pr,round(pr*0.85,2),round(pr*1.25,2),now())
    )
print(f"✅ {len(svc_list)} services")

# CUSTOMERS
c.execute("DELETE FROM customers WHERE tenant_id=?", (TENANT,))
cust_list = [
    ("Ahmet Yılmaz","ahmet@email.com","+90 532 111 0001",5,450.0),
    ("Sarah Mitchell","sarah@example.com","+44 77 1234 5678",8,1200.0),
    ("Müge Demir","muge@email.com","+90 543 222 0002",3,310.0),
    ("James Cooper","james@mail.com","+1 555 010 2020",12,2200.0),
    ("Aylin Kara","aylin@email.com","+90 555 333 0003",2,190.0),
    ("Elena Rossi","elena@email.com","+39 333 555 7890",6,875.0),
    ("Burak Şen","burak@email.com","+90 544 444 0004",4,420.0),
    ("Maria Santos","maria@email.com","+34 612 345 678",9,1540.0),
    ("Elif Arslan","elif@email.com","+90 555 555 0005",7,980.0),
    ("Alex Weber","alexw@email.com","+49 171 234 5678",11,1890.0),
    ("Selin Yıldız","seliny@email.com","+90 532 666 0006",1,85.0),
    ("Nour Al-Rashid","nour@email.com","+971 50 123 4567",15,3200.0),
]
for nm,em,ph,vc,ts in cust_list:
    c.execute(
        "INSERT INTO customers(id,tenant_id,full_name,email,phone,visit_count,total_spent,created_at) VALUES(?,?,?,?,?,?,?,?)",
        (uid(),TENANT,nm,em,ph,vc,ts,now())
    )
print(f"✅ {len(cust_list)} customers")

# BOOKINGS (62 adet)
staff_ids = [r[0] for r in c.execute("SELECT id FROM staff WHERE tenant_id=?", (TENANT,)).fetchall()]
room_ids  = [r[0] for r in c.execute("SELECT id FROM rooms WHERE tenant_id=?",  (TENANT,)).fetchall()]
svc_rows  = c.execute("SELECT id,price FROM services WHERE tenant_id=?", (TENANT,)).fetchall()
cust_ids  = [r[0] for r in c.execute("SELECT id FROM customers WHERE tenant_id=?", (TENANT,)).fetchall()]
ur = c.execute("SELECT id FROM users LIMIT 1").fetchone(); uid_user = ur[0] if ur else None

statuses = ['CONFIRMED','CONFIRMED','COMPLETED','COMPLETED','COMPLETED','CANCELLED']
n = 0
for i in range(62):
    days = random.randint(-30, 7)
    hr   = random.choice([9,10,11,12,13,14,15,16,17,18,19])
    mn   = random.choice([0,30])
    st   = (datetime.now() + timedelta(days=days)).replace(hour=hr, minute=mn, second=0, microsecond=0)
    svc_id,pr = random.choice(svc_rows)
    et   = st + timedelta(minutes=random.choice([60,75,90]))
    stat = random.choice(statuses)
    comm = round(pr*0.16,2)
    c.execute(
        """INSERT INTO bookings(id,tenant_id,user_id,customer_id,service_id,staff_id,room_id,
           start_time,end_time,price_snapshot,currency_snapshot,commission_snapshot,
           status,created_at,is_deleted,payment_intent_id)
           VALUES(?,?,?,?,?,?,?,?,?,?,'EUR',?,?,?,0,?)""",
        (uid(),TENANT,uid_user,random.choice(cust_ids),svc_id,
         random.choice(staff_ids),random.choice(room_ids),
         st.strftime('%Y-%m-%d %H:%M:%S'),et.strftime('%Y-%m-%d %H:%M:%S'),
         pr,comm,stat,now(),f"pi_{i:04d}")
    )
    n += 1
print(f"✅ {n} bookings")

# DAILY REVENUE (14 gün)
c.execute("DELETE FROM daily_revenue")
for d in range(14):
    day = (datetime.now()-timedelta(days=d)).strftime('%Y-%m-%d')
    rev = round(random.uniform(310,1450),2)
    bkn = random.randint(4,15)
    c.execute("INSERT OR REPLACE INTO daily_revenue(date,total_revenue,booking_count,avg_order_value) VALUES(?,?,?,?)",
              (day,rev,bkn,round(rev/bkn,2)))
print("✅ 14 days revenue")

c.commit(); c.close()
print("\n=== Phase 12: DATA HYDRATION TAMAMLANDI ✅ ===")
