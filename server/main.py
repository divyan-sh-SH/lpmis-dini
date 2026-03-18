from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import app_router
import uvicorn
app = FastAPI(title="HomeDash API")
app.include_router(app_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def read_root():
    return {"message": "HomeDash API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)