# Base Image: Python 3.10-slim for a balance of size and compatibility
FROM python:3.10-slim

# Prevent Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE=1
# Prevent Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
# gcc and python3-dev might be needed for some packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 8000

# Command to run the application
# We use uvicorn directly. In production, you might want to use a process manager like gunicorn with uvicorn workers,
# but for this setup, uvicorn is sufficient and performant.
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
