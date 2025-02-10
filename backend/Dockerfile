
FROM python:3.13-slim


WORKDIR /boredtap


COPY ./requirements.txt /boredtap/requirements.txt


RUN pip install --no-cache-dir --upgrade -r /boredtap/requirements.txt


COPY . /boredtap/backend


CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]