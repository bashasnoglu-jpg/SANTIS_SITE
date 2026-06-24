import json

def load_data():
    with open("airtable_dump.json", "r", encoding="utf-8") as f:
        return json.load(f)

def clean(val):
    if not val: return ""
    s = str(val).replace("|", "-").replace("\n", " ")
    return s

def extract_field(val):
    if not val:
        return ""
    if isinstance(val, list):
        if len(val) > 0 and isinstance(val[0], dict) and 'name' in val[0]:
            return clean(", ".join([v['name'] for v in val]))
        # if it's a list of strings and looks like 'rec...', it's an ID. But if we must, we return it.
        # Prefer lookup fields which have real names.
        filtered = [v for v in val if not str(v).startswith('rec')]
        if not filtered and val: filtered = val # fallback to rec if nothing else
        return clean(", ".join([str(v) for v in filtered]))
    if isinstance(val, dict):
        return clean(val.get('name', str(val)))
    return clean(val)

def extract_client(f):
    # Prefer the lookup field 'Client' which has the name, rather than 'Client_Link' which has 'rec...'
    val = f.get('Client') or f.get('Client_Link') or f.get('fldq07SPCXfwQ39Tc')
    return extract_field(val)

def extract_service(f):
    s_val = f.get('Service') or f.get('Service_Link') or f.get('fldLVMNj1biBuRMGJ')
    p_val = f.get('Package') or f.get('Linked Package') or f.get('Package_Link') or f.get('fldQZ0dfcxDY9haGp')
    s = extract_field(s_val)
    p = extract_field(p_val)
    if s and p: return f"Hizmet: {s} / Paket: {p}"
    if s: return s
    if p: return f"Paket: {p}"
    return ""

def extract_therapist(f):
    val = f.get('Therapist') or f.get('Therapist_Link') or f.get('flddXRKNIeh72ROX5')
    return extract_field(val)

def extract_room(f):
    val = f.get('Room') or f.get('Room_Link') or f.get('fld5xL3ciOBQRBt24')
    return extract_field(val)

def extract_location(f):
    val = f.get('Location') or f.get('Location_Link') or f.get('fldLkesTF4z1iiQp9')
    return extract_field(val)

def get_row(f, r_id, sorun, cozum):
    b_id = clean(f.get('Booking ID') or f.get('fldtlqLi9JpNxpnwh') or r_id)
    rec_time = clean(f.get('Reception Time Display', ''))
    client = extract_client(f)
    service = extract_service(f)
    therapist = extract_therapist(f)
    room = extract_room(f)
    location = extract_location(f)
    status = extract_field(f.get('Status_New'))
    pay_status = extract_field(f.get('Payment_Status_New'))
    
    return f"| {b_id} | {rec_time} | {client} | {service} | {therapist} | {room} | {location} | {status} | {pay_status} | {sorun} | {cozum} |"

def main():
    data = load_data()
    records = data.get("records", [])
    
    live_records = []
    for r in records:
        f = r.get('fields', {})
        env = extract_field(f.get('Environment'))
        if env.lower() == 'live':
            live_records.append(r)
            
    critical_list = []
    payment_list = []
    assignment_list = []
    
    header = "| Booking ID | Reception Time Display | Client | Service | Therapist | Room | Location | Status_New | Payment_Status_New | Sorun | Önerilen güvenli düzeltme |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
    
    for r in live_records:
        f = r.get('fields', {})
        b_id = clean(f.get('Booking ID') or f.get('fldtlqLi9JpNxpnwh') or r.get('id'))
        daily_check = extract_field(f.get('Daily_Reception_Check'))
        pay_status = extract_field(f.get('Payment_Status_New'))
        therapist_link = f.get('Therapist_Link')
        room_link = f.get('Room_Link')
        status = extract_field(f.get('Status_New'))
        
        # 1. CRITICAL
        if 'Ready for reception' not in daily_check:
            sorun = "Ready for reception onayında değil"
            cozum = "Eksikleri giderip Onay checkbox/durumunu kontrol edin"
            critical_list.append(get_row(f, r.get('id'), sorun, cozum))
            
        # 2. PAYMENT GAPS
        if not pay_status or pay_status.lower() != 'paid':
            if not pay_status:
                sorun = "Ödeme Durumu tamamen BOŞ"
                cozum = "Status 'Unpaid' olarak atanmalı"
            else:
                sorun = f"Ödeme tamamlanmamış (Mevcut: {pay_status})"
                if status.lower() == 'completed':
                    cozum = "Misafir çıkışı yapılmış ama ödeme alınmamış olabilir, teyit edin."
                else:
                    cozum = "Misafir işlemi tamamlandığında tahsilat kontrolü yapın."
            payment_list.append(get_row(f, r.get('id'), sorun, cozum))
            
        # 3. ASSIGNMENT GAPS
        if not therapist_link or not room_link:
            sorunlar = []
            if not therapist_link: sorunlar.append("Terapist eksik")
            if not room_link: sorunlar.append("Oda eksik")
            sorun = " & ".join(sorunlar)
            cozum = "Müsaitlik durumuna göre atama gerçekleştirin"
            assignment_list.append(get_row(f, r.get('id'), sorun, cozum))

    out = "# SANTIS OS — LIVE KAYITLAR OPERASYON ANALİZİ\n\n"
    out += "Airtable `Bookings` tablosundaki yalnızca `Environment = Live` olan kayıtlar analiz edilmiş ve Test/Archive verileri dışarıda bırakılmıştır.\n\n"
    
    out += "## 1. LIVE_CRITICAL (Operasyona Hazır Olmayanlar)\n"
    if critical_list:
        out += header + "\n" + "\n".join(critical_list) + "\n\n"
    else:
        out += "> Tüm Live kayıtlar Daily Reception için 'Ready' görünüyor.\n\n"
        
    out += "## 2. LIVE_PAYMENT_GAPS (Ödeme Eksikleri ve Sorunları)\n"
    if payment_list:
        out += header + "\n" + "\n".join(payment_list) + "\n\n"
    else:
        out += "> Tüm Live kayıtların ödemesi tamamlanmış durumda.\n\n"
        
    out += "## 3. LIVE_ASSIGNMENT_GAPS (Eksik Atamalar)\n"
    if assignment_list:
        out += header + "\n" + "\n".join(assignment_list) + "\n\n"
    else:
        out += "> Tüm Live kayıtların terapist ve oda ataması tamamlanmış.\n\n"
        
    with open("santis_live_analysis_results.md", "w", encoding="utf-8") as f:
        f.write(out)
        
if __name__ == "__main__":
    main()
