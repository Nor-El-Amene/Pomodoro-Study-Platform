# Pomodoro Study Platform

A full-stack productivity and study platform built from scratch.

## About

Pomodoro Study Platform is a personal full-stack web application designed to help students manage focused study sessions, organize tasks, track productivity, and study collaboratively through online study rooms.

## Preview

### Pomodoro Timer
![Pomodoro Timer](images/screenshots/pomodoro.jpg)

### Study Rooms
![Study Rooms](images/screenshots/study-rooms.jpg)

### Statistics
![Statistics](images/screenshots/statistics.jpg)

## Features

- Pomodoro timer and study sessions
- Task/todo management
- User authentication
- Study statistics
- Collaborative study rooms
- PeerJS-based room communication
- Paid study-room support through Chargily
- PHP/MySQL backend

## Tech Stack

- HTML
- CSS
- JavaScript
- PHP
- MySQL
- Node.js
- PeerJS

## Project Status

In development.

This repository contains a personal project built from scratch. Some features and deployment configuration are still being developed.

## Local setup

### 1. Requirements

- PHP with PDO MySQL support
- MySQL
- Node.js and npm

### 2. Install Node dependencies

```bash
npm install
```

This installs the dependency declared in `package.json`. The `node_modules` folder is intentionally not committed to GitHub.

### 3. Configure the database

Create a MySQL database named `focus_app` (or change `DB_NAME`).

The application expects the database tables used by the PHP API files.

### 4. Configure environment variables

Copy `.env.example` to `.env` as a reference for the values needed by your local/server environment.

The PHP configuration reads these values from server environment variables.

For local development, the built-in defaults in `api/config.php` point to:

- Host: `127.0.0.1`
- Port: `3307`
- Database: `focus_app`
- User: `root`

### 5. Run the PeerJS server

```bash
node peerserver.js
```

The PeerJS server uses port `9000` and the `/focus` path by default.

## Security

- Do not commit real API keys, payment secrets, database passwords, or other credentials.
- `node_modules/` is excluded through `.gitignore`.
- Development-only `api/test.php` is intentionally excluded from this repository.

## Author

LANABI NOR EL-AMENE
