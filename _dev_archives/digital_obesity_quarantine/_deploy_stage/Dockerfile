FROM python:3.11-slim

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the requirements first to cache the pip install step
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user and group
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy the rest of the application
COPY . .

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Expose the API port
EXPOSE 8000

# Command to run the application using Uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
