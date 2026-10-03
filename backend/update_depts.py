import sqlite3

conn = sqlite3.connect('yodha.db')
c = conn.cursor()

hospital_1_depts = [
    (1, 'Apex General Hospital - Emergency & Trauma', 'ED', 60, 48, 12, 28),
    (2, 'Apex General Hospital - Intensive Care Unit (ICU)', 'ICU', 40, 36, 4, 22),
    (3, 'Apex General Hospital - General Medicine', 'General', 120, 95, 25, 35),
    (4, 'Apex General Hospital - Pediatrics', 'Pediatric', 50, 35, 15, 18),
    (5, 'Apex General Hospital - General Surgery & OR', 'OR', 30, 22, 8, 24),
    (21, 'Apex General Hospital - Cardiology', 'Cardiology', 50, 42, 8, 20),
    (22, 'Apex General Hospital - Neurology', 'Neurology', 40, 32, 8, 18),
    (23, 'Apex General Hospital - Orthopedics', 'Orthopedics', 40, 30, 10, 16)
]

for dept_id, name, dtype, total, occ, avail, staff in hospital_1_depts:
    c.execute('SELECT id FROM departments WHERE id = ?', (dept_id,))
    if c.fetchone():
        c.execute('UPDATE departments SET name = ?, type = ?, total_beds = ?, occupied_beds = ?, available_beds = ?, staff_count = ?, status = ? WHERE id = ?',
                  (name, dtype, total, occ, avail, staff, 'active', dept_id))
        print(f'Updated Dept {dept_id}: {name}')
    else:
        c.execute('INSERT INTO departments (id, hospital_id, name, type, total_beds, occupied_beds, available_beds, reserved_beds, staff_count, status) VALUES (?, 1, ?, ?, ?, ?, ?, 2, ?, ?)',
                  (dept_id, name, dtype, total, occ, avail, staff, 'active'))
        print(f'Inserted Dept {dept_id}: {name}')
        prefix = dtype[:3].upper()
        for i in range(1, total + 1):
            st = 'occupied' if i <= occ else 'available'
            c.execute('INSERT INTO beds (department_id, bed_number, ward, type, status, equipment, isolation_capable) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      (dept_id, f'{prefix}-{i:03d}', name, 'standard' if dtype != 'ICU' else 'icu', st, 'standard_monitor', 0))

conn.commit()

c.execute('SELECT id, name, type, total_beds, available_beds FROM departments WHERE hospital_id = 1')
for row in c.fetchall():
    print('H1 Department:', row)

conn.close()
