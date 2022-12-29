FROM artifactory.nioint.com/dd-venus-docker-virtual/base/fx/build/node16:1.4.0

EXPOSE 8090
EXPOSE 8091

RUN mkdir -p /app

WORKDIR /app

COPY . /app/
RUN chmod +x /app/start.sh

CMD ["/bin/bash", "./start.sh" ]
