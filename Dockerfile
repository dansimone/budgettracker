FROM ryanhanwu/docker-meteor

EXPOSE 3000

ENV HTTP_PROXY=http://adc-proxy.oracle.com:80
ENV HTTPS_PROXY=http://adc-proxy.oracle.com:80
ENV http_proxy=http://adc-proxy.oracle.com:80
ENV METEOR_ALLOW_SUPERUSER=true

RUN apt-get install -y locales
RUN locale-gen en_US.UTF-8 
RUN localedef -i en_GB -f UTF-8 en_US.UTF-8

RUN mkdir /ui-node
WORKDIR /ui-node  
COPY . /ui-node
RUN rm -rf /ui-node/build

RUN meteor reset

