# Use Node.js official image as base
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port your app will run on
EXPOSE 3001

# Start the app
CMD ["node", "index.js"]  # Replace index.js with the main file name of your server
