"""Patch the app's DB engine to use an in-memory SQLite before test collection."""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_URL = "sqlite:////tmp/insightai_test.db"

os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["UPLOAD_DIR"] = "/tmp/insightai_test_uploads"
os.environ["MODEL_DIR"] = "/tmp/insightai_test_models"
