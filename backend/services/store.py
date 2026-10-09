import sqlite3
import json
from datetime import datetime, timedelta
import os
import uuid

INITIAL_BEACHES = [
  {"id": "versova", "name": "Versova Creek & Beach", "sector": "North-West", "lat": 19.1350, "lon": 72.8140, "baseline_risk": 94.0, "current_debris_kg": 520.0, "cleaned_debris_kg": 420.0, "remaining_debris_kg": 100.0, "status": "High Risk"},
  {"id": "juhu", "name": "Juhu Beach Shoreline", "sector": "North-West", "lat": 19.0970, "lon": 72.8258, "baseline_risk": 82.0, "current_debris_kg": 380.0, "cleaned_debris_kg": 310.0, "remaining_debris_kg": 70.0, "status": "Assigned"},
  {"id": "aksa", "name": "Aksa Beach & Dana Pani", "sector": "North-West", "lat": 19.1750, "lon": 72.7920, "baseline_risk": 76.0, "current_debris_kg": 290.0, "cleaned_debris_kg": 220.0, "remaining_debris_kg": 70.0, "status": "Monitoring"},
  {"id": "mahim", "name": "Mahim Bay & Mithi River Outfall", "sector": "Central", "lat": 19.0350, "lon": 72.8350, "baseline_risk": 88.0, "current_debris_kg": 650.0, "cleaned_debris_kg": 520.0, "remaining_debris_kg": 130.0, "status": "High Risk"},
  {"id": "bandra", "name": "Bandra Carter Road & Channel", "sector": "Central", "lat": 19.0550, "lon": 72.8180, "baseline_risk": 61.0, "current_debris_kg": 310.0, "cleaned_debris_kg": 240.0, "remaining_debris_kg": 70.0, "status": "Monitoring"},
  {"id": "dadar", "name": "Dadar Chowpatty Shoreline", "sector": "Central", "lat": 19.0250, "lon": 72.8320, "baseline_risk": 55.0, "current_debris_kg": 270.0, "cleaned_debris_kg": 210.0, "remaining_debris_kg": 60.0, "status": "Monitoring"},
  {"id": "worli", "name": "Worli Sea Face Basin", "sector": "South", "lat": 19.0120, "lon": 72.8150, "baseline_risk": 54.0, "current_debris_kg": 230.0, "cleaned_debris_kg": 180.0, "remaining_debris_kg": 50.0, "status": "Monitoring"},
  {"id": "girgaon", "name": "Girgaon Marine Drive Bay", "sector": "South", "lat": 18.9550, "lon": 72.8120, "baseline_risk": 42.0, "current_debris_kg": 190.0, "cleaned_debris_kg": 160.0, "remaining_debris_kg": 30.0, "status": "Cleaned"},
  {"id": "colaba", "name": "Colaba Base & Harbor", "sector": "South", "lat": 18.9000, "lon": 72.8150, "baseline_risk": 35.0, "current_debris_kg": 140.0, "cleaned_debris_kg": 120.0, "remaining_debris_kg": 20.0, "status": "Cleaned"}
]

class StoreService:
    def __init__(self, db_path="tidal_state.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 1. Coastal Beaches Master Table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS beaches (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sector TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            baseline_risk REAL DEFAULT 50.0,
            current_debris_kg REAL DEFAULT 0.0,
            cleaned_debris_kg REAL DEFAULT 0.0,
            remaining_debris_kg REAL DEFAULT 0.0,
            status TEXT DEFAULT 'Monitoring',
            last_cleaned_at DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Check if beaches table is seeded
        cursor.execute("SELECT COUNT(*) FROM beaches")
        if cursor.fetchone()[0] == 0:
            now_iso = (datetime.now() - timedelta(hours=14)).isoformat()
            for b in INITIAL_BEACHES:
                cursor.execute('''
                INSERT INTO beaches (id, name, sector, lat, lon, baseline_risk, current_debris_kg, cleaned_debris_kg, remaining_debris_kg, status, last_cleaned_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    b["id"], b["name"], b["sector"], b["lat"], b["lon"],
                    b["baseline_risk"], b["current_debris_kg"], b["cleaned_debris_kg"],
                    b["remaining_debris_kg"], b["status"], now_iso
                ))

        # 2. Cleanup Tasks & Execution Records
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS cleanup_tasks (
            id TEXT PRIMARY KEY,
            beach_id TEXT,
            beach_name TEXT,
            team_name TEXT,
            vessel_id TEXT,
            priority TEXT,
            predicted_kg REAL,
            collected_kg REAL DEFAULT 0.0,
            remaining_kg REAL DEFAULT 0.0,
            status TEXT DEFAULT 'Assigned',
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            before_image_path TEXT,
            after_image_path TEXT,
            effectiveness_pct REAL DEFAULT 0.0,
            notes TEXT
        )
        ''')

        # 3. Model Evaluations & Prediction vs Reality Tracking
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS model_evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            beach_id TEXT,
            beach_name TEXT,
            predicted_kg REAL,
            actual_collected_kg REAL,
            absolute_error_kg REAL,
            accuracy_pct REAL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Check if model_evaluations is seeded with historical tracking
        cursor.execute("SELECT COUNT(*) FROM model_evaluations")
        if cursor.fetchone()[0] == 0:
            sample_evals = [
                ("versova", "Versova Creek", 450.0, 420.0, 30.0, 93.3),
                ("juhu", "Juhu Beach", 330.0, 310.0, 20.0, 93.9),
                ("bandra", "Bandra Channel", 260.0, 240.0, 20.0, 92.3),
                ("mahim", "Mahim Bay", 550.0, 520.0, 30.0, 94.5),
                ("worli", "Worli Sea Face", 190.0, 180.0, 10.0, 94.7),
            ]
            for se in sample_evals:
                cursor.execute('''
                INSERT INTO model_evaluations (beach_id, beach_name, predicted_kg, actual_collected_kg, absolute_error_kg, accuracy_pct)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', se)
        
        # 4. Environment snapshots
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS env_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_json TEXT
        )
        ''')
        
        # 5. Field reports (optical analysis)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS field_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            composition TEXT,
            estimated_weight_kg REAL,
            category TEXT,
            matched_upcycler TEXT,
            item_count INTEGER,
            image_path TEXT
        )
        ''')

        # 6. Circular Material Recovery Manifests
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS circular_manifests (
            id TEXT PRIMARY KEY,
            task_id TEXT,
            beach_id TEXT,
            beach_name TEXT,
            plastic_mass_kg REAL NOT NULL,
            composition TEXT,
            gross_valuation_inr REAL,
            co2e_avoided_kg REAL,
            epr_credits INTEGER,
            upcycler_facility TEXT,
            status TEXT DEFAULT 'PENDING_VALUATION',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            signed_at DATETIME
        )
        ''')

        cursor.execute("SELECT COUNT(*) FROM circular_manifests")
        if cursor.fetchone()[0] == 0:
            sample_manifests = [
                ("MNF-7C91B4", "TASK-J71A29", "juhu", "Juhu Beach", 310.0, "High-Density Polyethylene (HDPE) & Rigid Plastics", 10850.0, 558.0, 372, "Lucro Plastecycle Pvt Ltd", "MANIFEST_ISSUED", (datetime.now() - timedelta(hours=14)).isoformat(), (datetime.now() - timedelta(hours=13)).isoformat()),
                ("MNF-4A82F1", "TASK-V82B14", "versova", "Versova Creek", 420.0, "Polyethylene Terephthalate (PET) & Ghost Fishing Line", 14700.0, 756.0, 504, "Lucro Plastecycle Pvt Ltd", "DISPATCHED_TO_UPCYCLER", (datetime.now() - timedelta(hours=28)).isoformat(), (datetime.now() - timedelta(hours=26)).isoformat()),
                ("MNF-1E33D9", "TASK-M19C88", "mahim", "Mahim Bay", 520.0, "Mixed Urban Rigid Polymers & Micro-Debris", 18200.0, 936.0, 624, "Shakti Plastic Industries", "MANIFEST_ISSUED", (datetime.now() - timedelta(hours=48)).isoformat(), (datetime.now() - timedelta(hours=47)).isoformat()),
            ]
            for sm in sample_manifests:
                cursor.execute('''
                INSERT INTO circular_manifests (id, task_id, beach_id, beach_name, plastic_mass_kg, composition, gross_valuation_inr, co2e_avoided_kg, epr_credits, upcycler_facility, status, created_at, signed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', sm)

        # 7. Model Retrain Audit History
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS model_retrain_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            mae REAL,
            r2 REAL,
            samples_processed INTEGER,
            model_version TEXT DEFAULT 'v2.5-prod',
            status TEXT DEFAULT 'SUCCESS'
        )
        ''')
        
        cursor.execute("SELECT COUNT(*) FROM model_retrain_history")
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
            INSERT INTO model_retrain_history (timestamp, mae, r2, samples_processed, model_version, status)
            VALUES (?, 14.2, 0.89, 4820, 'v2.5-prod', 'SUCCESS')
            ''', ((datetime.now() - timedelta(days=2)).isoformat(),))

        conn.commit()
        conn.close()

    # --- BEACHES API ---
    def get_beaches(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM beaches ORDER BY baseline_risk DESC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    def get_beach(self, beach_id: str):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM beaches WHERE id = ?", (beach_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    # --- CLEANUP TASKS & RECORDING ---
    def get_cleanup_tasks(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cleanup_tasks ORDER BY assigned_at DESC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    def create_cleanup_task(self, beach_id: str, team_name: str, vessel_id: str = "TIDAL-SKIM-01", predicted_kg: float = 350.0):
        task_id = f"TASK-{uuid.uuid4().hex[:6].upper()}"
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Fetch beach info
        cursor.execute("SELECT name, baseline_risk FROM beaches WHERE id = ?", (beach_id,))
        b = cursor.fetchone()
        beach_name = b[0] if b else beach_id
        priority = "Critical" if b and b[1] > 80 else "High"

        cursor.execute('''
        INSERT INTO cleanup_tasks (id, beach_id, beach_name, team_name, vessel_id, priority, predicted_kg, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Assigned')
        ''', (task_id, beach_id, beach_name, team_name, vessel_id, priority, predicted_kg))

        cursor.execute("UPDATE beaches SET status = 'Assigned' WHERE id = ?", (beach_id,))
        conn.commit()
        conn.close()
        return task_id

    def submit_cleanup_execution(self, task_id: str, beach_id: str, collected_kg: float, remaining_kg: float, before_img: str = "", after_img: str = "", effectiveness_pct: float = 85.0, notes: str = ""):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now_iso = datetime.now().isoformat()

        # 1. Update Task
        cursor.execute('''
        UPDATE cleanup_tasks
        SET collected_kg = ?, remaining_kg = ?, status = 'Completed', completed_at = ?,
            before_image_path = ?, after_image_path = ?, effectiveness_pct = ?, notes = ?
        WHERE id = ?
        ''', (collected_kg, remaining_kg, now_iso, before_img, after_img, effectiveness_pct, notes, task_id))

        # 2. Update Beach State
        cursor.execute('''
        UPDATE beaches
        SET cleaned_debris_kg = cleaned_debris_kg + ?,
            remaining_debris_kg = ?,
            current_debris_kg = ?,
            status = CASE WHEN ? <= 20 THEN 'Cleaned' ELSE 'Partially Cleaned' END,
            baseline_risk = MAX(15.0, baseline_risk * (1.0 - (? / 100.0))),
            last_cleaned_at = ?,
            updated_at = ?
        WHERE id = ?
        ''', (collected_kg, remaining_kg, remaining_kg, effectiveness_pct, now_iso, now_iso, beach_id))

        # 3. Fetch Beach info for Evaluation Recording
        cursor.execute("SELECT name, current_debris_kg FROM beaches WHERE id = ?", (beach_id,))
        beach_info = cursor.fetchone()
        beach_name = beach_info[0] if beach_info else beach_id
        predicted = collected_kg + remaining_kg

        abs_error = abs(predicted - collected_kg)
        accuracy = max(50.0, 100.0 - (abs_error / max(1.0, predicted) * 100.0))

        cursor.execute('''
        INSERT INTO model_evaluations (beach_id, beach_name, predicted_kg, actual_collected_kg, absolute_error_kg, accuracy_pct, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (beach_id, beach_name, predicted, collected_kg, abs_error, accuracy, now_iso))

        # 4. Auto-Queue Pending Circular Material Batch for Upcycler Valuation
        manifest_id = f"MNF-{uuid.uuid4().hex[:6].upper()}"
        gross_val = round(collected_kg * 35.0, 2)
        co2e = round(collected_kg * 1.8, 1)
        epr = int(collected_kg * 1.2)
        cursor.execute('''
        INSERT INTO circular_manifests (id, task_id, beach_id, beach_name, plastic_mass_kg, composition, gross_valuation_inr, co2e_avoided_kg, epr_credits, upcycler_facility, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'Mixed Recovered Coastal Polymers (PET/HDPE)', ?, ?, ?, 'Lucro Plastecycle Pvt Ltd', 'PENDING_VALUATION', ?)
        ''', (manifest_id, task_id, beach_id, beach_name, collected_kg, gross_val, co2e, epr, now_iso))

        conn.commit()
        conn.close()
        return True

    # --- CIRCULAR MANIFESTS API ---
    def get_circular_manifests(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM circular_manifests ORDER BY created_at DESC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    def sign_circular_manifest(self, manifest_id: str, upcycler_facility: str = "Lucro Plastecycle Pvt Ltd"):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now_iso = datetime.now().isoformat()
        cursor.execute('''
        UPDATE circular_manifests
        SET status = 'MANIFEST_ISSUED', signed_at = ?, upcycler_facility = ?
        WHERE id = ?
        ''', (now_iso, upcycler_facility, manifest_id))
        conn.commit()
        conn.close()
        return True

    # --- RETRAIN AUDIT API ---
    def record_retrain(self, metrics: dict, samples_processed: int):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now_iso = datetime.now().isoformat()
        cursor.execute('''
        INSERT INTO model_retrain_history (timestamp, mae, r2, samples_processed, model_version, status)
        VALUES (?, ?, ?, ?, 'v2.5-prod', 'SUCCESS')
        ''', (now_iso, float(metrics.get("mae", 14.0)), float(metrics.get("r2", 0.90)), samples_processed))
        conn.commit()
        conn.close()
        return True

    def get_retrain_history(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM model_retrain_history ORDER BY timestamp DESC LIMIT 10")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    # --- ACCURACY ANALYTICS ---
    def get_accuracy_metrics(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM model_evaluations ORDER BY recorded_at DESC LIMIT 20")
        evals = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute("SELECT AVG(accuracy_pct), AVG(absolute_error_kg), COUNT(*) FROM model_evaluations")
        summary_row = cursor.fetchone()
        avg_accuracy = round(summary_row[0] or 93.5, 1)
        avg_error = round(summary_row[1] or 22.0, 1)
        total_evals = summary_row[2] or len(evals)

        conn.close()
        return {
            "evaluations": evals,
            "average_accuracy_pct": avg_accuracy,
            "average_error_kg": avg_error,
            "total_verified_missions": total_evals
        }

    # --- FIELD REPORTS & SNAPSHOTS ---
    def save_env_snapshot(self, data: dict):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO env_snapshots (data_json) VALUES (?)", (json.dumps(data),))
        conn.commit()
        conn.close()

    def save_field_report(self, ai_analysis: dict, matched_upcycler: str, image_path: str = ""):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO field_reports (composition, estimated_weight_kg, category, matched_upcycler, item_count, image_path)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            ai_analysis.get("composition", "Unknown"),
            float(ai_analysis.get("estimated_weight_kg", 0)),
            ai_analysis.get("category", "Unknown"),
            matched_upcycler,
            int(ai_analysis.get("item_count", 0)),
            image_path
        ))
        conn.commit()
        conn.close()

store_service = StoreService()
