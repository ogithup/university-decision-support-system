from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.meta import (
    DataContract,
    ManualReviewQueue,
    MetaDataSource,
    MetaIngestionBatch,
    ReconciliationReport,
    UploadedSourceFile,
)


class AdminRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_data_contracts(self) -> list[DataContract]:
        return list(self.db.execute(select(DataContract).where(DataContract.is_active.is_(True))).scalars())

    def list_batches(self, limit: int = 20) -> list[tuple[MetaIngestionBatch, str | None]]:
        stmt = (
            select(MetaIngestionBatch, MetaDataSource.source_code)
            .join(MetaDataSource, MetaDataSource.id == MetaIngestionBatch.source_id, isouter=True)
            .order_by(desc(MetaIngestionBatch.started_at))
            .limit(limit)
        )
        return list(self.db.execute(stmt).all())

    def get_batch(self, batch_id: str) -> tuple[MetaIngestionBatch, str | None] | None:
        stmt = (
            select(MetaIngestionBatch, MetaDataSource.source_code)
            .join(MetaDataSource, MetaDataSource.id == MetaIngestionBatch.source_id, isouter=True)
            .where(MetaIngestionBatch.id == batch_id)
        )
        return self.db.execute(stmt).first()

    def list_manual_review_items(self) -> list[ManualReviewQueue]:
        stmt = select(ManualReviewQueue).order_by(desc(ManualReviewQueue.created_at))
        return list(self.db.execute(stmt).scalars())

    def latest_reconciliation(self) -> ReconciliationReport | None:
        stmt = select(ReconciliationReport).order_by(desc(ReconciliationReport.created_at)).limit(1)
        return self.db.execute(stmt).scalar_one_or_none()

    def create_uploaded_file(self, uploaded_file: UploadedSourceFile) -> UploadedSourceFile:
        self.db.add(uploaded_file)
        self.db.flush()
        return uploaded_file
