FROM postgres:12.3

COPY create.sql /docker-entrypoint-initdb.d
RUN chmod 644 /docker-entrypoint-initdb.d/create.sql
