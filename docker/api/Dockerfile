FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential curl \
  && rm -rf /var/lib/apt/lists/*

# Create unprivileged system group and user
RUN groupadd -g 10001 santis && useradd -u 10001 -g santis -s /bin/sh -m santis

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=santis:santis . .

USER santis

EXPOSE 8000

CMD ["sh", "-c", "uvicorn ${SANTIS_API_APP:-server:app} --host 0.0.0.0 --port 8000"]

