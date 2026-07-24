from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dimensions import DimPersonnel, DimProgram, DimStudent, DimUnit
from app.models.meta import StgYoksisProgram, StgYoksisStaff, StgYoksisStudent


class WarehouseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create_unit(self, unit_code: str | None) -> DimUnit | None:
        if not unit_code:
            return None
        unit = self.db.execute(select(DimUnit).where(DimUnit.unit_code == unit_code)).scalar_one_or_none()
        if unit:
            return unit

        unit = DimUnit(
            id=uuid4(),
            unit_code=unit_code,
            unit_name=unit_code,
            unit_type="academic_unit",
            is_academic=True,
            is_active=True,
        )
        self.db.add(unit)
        self.db.flush()
        return unit

    def upsert_program_from_stage(self, stage: StgYoksisProgram) -> DimProgram | None:
        if not stage.program_code:
            return None
        unit = self.get_or_create_unit(stage.unit_code)
        program = self.db.execute(
            select(DimProgram).where(DimProgram.program_code == stage.program_code)
        ).scalar_one_or_none()

        if not program:
            program = DimProgram(
                id=uuid4(),
                program_code=stage.program_code,
                program_name=stage.program_name or stage.program_code,
                unit_id=unit.id if unit else None,
                degree_level=stage.degree_level or "unknown",
                language_code=stage.language_code,
                education_type=stage.education_type,
                is_active=True,
            )
            self.db.add(program)
        else:
            program.program_name = stage.program_name or program.program_name
            if unit:
                program.unit_id = unit.id
            program.degree_level = stage.degree_level or program.degree_level
            program.language_code = stage.language_code or program.language_code
            program.education_type = stage.education_type or program.education_type

        self.db.flush()
        return program

    def upsert_student_from_stage(self, stage: StgYoksisStudent) -> DimStudent | None:
        if not stage.student_no:
            return None

        self.get_or_create_unit(stage.unit_code)
        if stage.program_code:
            program_stage = StgYoksisProgram(
                batch_id=stage.batch_id,
                program_code=stage.program_code,
                program_name=stage.program_code,
                unit_code=stage.unit_code,
                degree_level="unknown",
                language_code=None,
                education_type=None,
                source_payload=stage.source_payload,
                transform_status="derived",
            )
            self.upsert_program_from_stage(program_stage)

        student = self.db.execute(
            select(DimStudent).where(DimStudent.student_no == stage.student_no)
        ).scalar_one_or_none()
        if not student:
            student = DimStudent(
                id=uuid4(),
                student_no=stage.student_no,
                gender=stage.gender,
                nationality_code=stage.nationality_code,
                scholarship_type=stage.scholarship_type,
                scholarship_rate=float(stage.scholarship_rate) if stage.scholarship_rate else None,
                entry_year=stage.entry_year,
                current_status=stage.current_status,
            )
            self.db.add(student)
        else:
            student.gender = stage.gender or student.gender
            student.nationality_code = stage.nationality_code or student.nationality_code
            student.scholarship_type = stage.scholarship_type or student.scholarship_type
            student.scholarship_rate = (
                float(stage.scholarship_rate) if stage.scholarship_rate else student.scholarship_rate
            )
            student.entry_year = stage.entry_year or student.entry_year
            student.current_status = stage.current_status or student.current_status

        self.db.flush()
        return student

    def upsert_personnel_from_stage(self, stage: StgYoksisStaff) -> DimPersonnel | None:
        if not stage.personnel_no:
            return None

        unit = self.get_or_create_unit(stage.unit_code)
        personnel = self.db.execute(
            select(DimPersonnel).where(DimPersonnel.personnel_no == stage.personnel_no)
        ).scalar_one_or_none()
        if not personnel:
            personnel = DimPersonnel(
                id=uuid4(),
                personnel_no=stage.personnel_no,
                unit_id=unit.id if unit else None,
                title_code=stage.title_code,
                personnel_type=stage.personnel_type,
                employment_status=stage.employment_status,
                hire_date=None,
                is_active=True,
            )
            self.db.add(personnel)
        else:
            if unit:
                personnel.unit_id = unit.id
            personnel.title_code = stage.title_code or personnel.title_code
            personnel.personnel_type = stage.personnel_type or personnel.personnel_type
            personnel.employment_status = stage.employment_status or personnel.employment_status

        self.db.flush()
        return personnel

    def get_program_stage_rows(self, batch_id: str) -> list[StgYoksisProgram]:
        return list(
            self.db.execute(
                select(StgYoksisProgram).where(StgYoksisProgram.batch_id == batch_id)
            ).scalars()
        )

    def get_student_stage_rows(self, batch_id: str) -> list[StgYoksisStudent]:
        return list(
            self.db.execute(
                select(StgYoksisStudent).where(StgYoksisStudent.batch_id == batch_id)
            ).scalars()
        )

    def get_staff_stage_rows(self, batch_id: str) -> list[StgYoksisStaff]:
        return list(
            self.db.execute(
                select(StgYoksisStaff).where(StgYoksisStaff.batch_id == batch_id)
            ).scalars()
        )

