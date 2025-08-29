#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');
const url = 'http://localhost:3000';

let browserOpened = false;

// Function to check if the server is ready
function waitForServer(callback) {
  if (browserOpened) {
    console.log('Browser already opened, exiting...');
    process.exit(0);
  }

  const req = http.get(url, (res) => {
    if (res.statusCode === 200) {
      console.log('Server is ready, opening browser...');
      browserOpened = true;
      callback();
    } else {
      console.log(`Server responded with status ${res.statusCode}, retrying...`);
      setTimeout(() => waitForServer(callback), 1000);
    }
  });

  req.on('error', (err) => {
    console.log('Server not ready yet, retrying...');
    setTimeout(() => waitForServer(callback), 1000);
  });

  req.setTimeout(1000, () => {
    req.destroy();
    setTimeout(() => waitForServer(callback), 1000);
  });
}

// Function to open the browser
function openBrowser() {
  const platform = process.platform;
  let command;

  if (platform === 'darwin') {
    // macOS - try Chrome first, fallback to default browser
    command = `open -a 'Google Chrome' ${url} || open ${url}`;
  } else if (platform === 'win32') {
    // Windows
    command = `start ${url}`;
  } else {
    // Linux and others
    command = `xdg-open ${url}`;
  }

  exec(command, (error) => {
    if (error) {
      console.error('Error opening browser:', error.message);
      console.log(`Please open your browser manually and go to ${url}`);
    } else {
      console.log(`Opened ${url} in browser`);
    }
    // Exit the script after attempting to open the browser
    process.exit(0);
  });
}

// Add a small delay to ensure the dev server has started
setTimeout(() => {
  console.log('Waiting for Next.js dev server to start...');
  waitForServer(openBrowser);
}, 2000);

