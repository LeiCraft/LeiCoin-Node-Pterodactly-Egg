# Use the official PHP 8.1 Apache image as the base image
FROM php:8.1-apache

RUN apt-get update && apt-get install -y git

# Set the working directory to /home/container
WORKDIR /home/container

Copy . /home/container

# Copy the Apache configuration file to the home directory

# Disable the default virtual host
RUN a2dissite 000-default

# Expose a placeholder port (you can use any unused port)
EXPOSE 12200

RUN sed -i "s/Listen 80/Listen 12200/" /etc/apache2/ports.conf

#RUN chmod 777 /etc/apache2/ports.conf

# Define an entry point script to start Apache with the configured port and config
Copy start-apache.sh /start-apache.sh
CMD ["/bin/bash", "/start-apache.sh"]
