# ~/farmaciadocker/stack-front/Dockerfile
FROM httpd:2.4-alpine

# Copia todos los HTML/JS/CSS al docroot de Apache
COPY front/ /usr/local/apache2/htdocs/

# Expone el puerto 80
EXPOSE 80
