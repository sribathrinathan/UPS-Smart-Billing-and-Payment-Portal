FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Bundle app source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start server
CMD [ "npm", "start" ]
