FROM node:18


WORKDIR /opt/foundryvtt
COPY ./foundryvtt.zip /opt/foundryvtt/foundryvtt.zip
RUN unzip -o foundryvtt.zip && rm foundryvtt.zip
CMD node resources/app/main.js --dataPath=/opt/data/foundryvtt