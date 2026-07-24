from __future__ import annotations

import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.repositories.admin_repository import AdminRepository
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.integration_admin import FileUploadResponse
from app.models.meta import UploadedSourceFile


class FileUploadIntegrationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.admin_repo = AdminRepository(db)
        self.integration_repo = IntegrationRepository(db)
        self.storage_root = Path("storage/raw_uploads")

    async def upload_file(
        self,
        *,
        source_code: str,
        upload: UploadFile,
        requested_by: str,
        period_label: str | None,
    ) -> FileUploadResponse:
        source = self.integration_repo.get_source(source_code)
        if not source:
            raise ValueError(f"Unknown source code: {source_code}")

        self.storage_root.mkdir(parents=True, exist_ok=True)
        content = await upload.read()
        file_hash = hashlib.sha256(content).hexdigest()

        batch = self.integration_repo.create_batch(source_id=source.id, requested_by=requested_by)
        self.db.commit()
        self.db.refresh(batch)

        file_suffix = Path(upload.filename or "upload.bin").suffix
        target_path = self.storage_root / f"{batch.id}{file_suffix}"
        target_path.write_bytes(content)

        uploaded_file = UploadedSourceFile(
            id=uuid4(),
            batch_id=batch.id,
            source_code=source_code,
            file_name=upload.filename or "unnamed-file",
            file_type=upload.content_type,
            period_label=period_label,
            storage_path=str(target_path),
            sha256_hash=file_hash,
            file_size_bytes=len(content),
            row_count=0,
        )
        self.admin_repo.create_uploaded_file(uploaded_file)
        self.integration_repo.set_batch_result(
            batch,
            status="uploaded",
            record_count=0,
            checksum=file_hash,
        )
        self.db.commit()

        return FileUploadResponse(
            batch_id=str(batch.id),
            source_code=source_code,
            file_name=uploaded_file.file_name,
            sha256_hash=file_hash,
            file_size_bytes=len(content),
            status="uploaded",
            message="Dosya ham arsive alindi. Semantik dogrulama ve parser asamasi sonraki adimdir.",
        )
