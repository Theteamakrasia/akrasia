FROM postgres:16-alpine
COPY schema/ /docker-entrypoint-initdb.d/
