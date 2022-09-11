FROM node:12

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/

# Bundle app source
COPY . /usr/src/app

RUN npm install -g typescript
RUN npm install -g ts-node
RUN npm install

CMD npm start
