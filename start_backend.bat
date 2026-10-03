@echo off
echo Starting YODHA 2.0 Backend...
cd backend
python seed.py
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
