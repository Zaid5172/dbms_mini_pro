-- JOIN + GROUP BY + HAVING: locations with at least one available space.
SELECT l.name, COUNT(*) AS available
FROM parking_lots l JOIN parking_slots s ON s.lot_id=l.lot_id
WHERE s.status='Available' GROUP BY l.lot_id,l.name HAVING COUNT(*)>0
ORDER BY available DESC;
-- Subquery: customers whose revenue exceeds the mean completed booking fee.
SELECT u.user_id,u.name,SUM(b.total_fee) revenue
FROM users u JOIN bookings b ON b.user_id=u.user_id
WHERE b.status='Completed' GROUP BY u.user_id,u.name
HAVING SUM(b.total_fee)>(SELECT AVG(total_fee) FROM bookings WHERE status='Completed');
SELECT * FROM vw_active_occupancy;
-- Safe DDL demonstration: disposable table only; never drops business records.
CREATE TABLE ddl_example (id INT PRIMARY KEY);
ALTER TABLE ddl_example ADD COLUMN note VARCHAR(100);
DROP TABLE ddl_example;
-- EXPLAIN demonstrates use of idx_lot_status.
EXPLAIN SELECT slot_id FROM parking_slots WHERE lot_id=1 AND status='Available';
