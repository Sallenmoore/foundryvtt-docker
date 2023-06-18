FROM node:16-alpine


WORKDIR /opt/foundryvtt
COPY ./foundryvtt.zip /opt/foundryvtt/foundryvtt.zip
RUN unzip -o foundryvtt.zip && rm *.zip
CMD node resources/app/main.js --dataPath=/data/foundryvtt