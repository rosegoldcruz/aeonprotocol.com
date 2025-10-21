import json
from unittest.mock import Mock, patch

from services.worker.webgen_consumer import process_web_project


def test_process_web_project_updates_status(monkeypatch):
    mock_db_ctx = Mock()
    mock_db = mock_db_ctx.__enter__.return_value

    with patch('services.worker.webgen_consumer.SessionLocal', return_value=mock_db_ctx):
        data = {"project_id": "test-123", "webspec": {"site_type": "saas"}, "auto_deploy": True}
        process_web_project(data)
        assert mock_db.execute.called
        assert mock_db.commit.called

