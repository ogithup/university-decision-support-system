from sqlalchemy.orm import Session

from app.repositories.warehouse_repository import WarehouseRepository


class YoksisWarehouseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = WarehouseRepository(db)

    def upsert_from_batch(self, resource: str, batch_id: str) -> int:
        if resource == "programs":
            rows = self.repo.get_program_stage_rows(batch_id)
            count = 0
            for row in rows:
                if self.repo.upsert_program_from_stage(row):
                    count += 1
            self.db.flush()
            return count

        if resource == "students":
            rows = self.repo.get_student_stage_rows(batch_id)
            count = 0
            for row in rows:
                if self.repo.upsert_student_from_stage(row):
                    count += 1
            self.db.flush()
            return count

        if resource == "staff":
            rows = self.repo.get_staff_stage_rows(batch_id)
            count = 0
            for row in rows:
                if self.repo.upsert_personnel_from_stage(row):
                    count += 1
            self.db.flush()
            return count

        raise ValueError(f"Unsupported warehouse upsert resource: {resource}")

