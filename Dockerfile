FROM python:3.10-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the entire project
COPY . /app

# Expose dynamic port
EXPOSE 8000

# Run the backend server
CMD ["python", "backend/server.py"]
