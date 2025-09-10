# Life Link Backend Deployment

## Environment Variables

The backend requires the following environment variables to be set in Railway:

- `PORT` - The port number the server listens on (default 3000 if not set).
- `MONGODB_URI` - MongoDB connection string.
- `JWT_SECRET` - Secret key for JWT authentication.
- `EMAIL_USER` - Email username for sending emails.
- `EMAIL_PASS` - Email password for sending emails.
- Any other variables you use in your `.env` or `config.env` files.

## Deployment Steps

1. Push your backend code to a GitHub repository.
2. Create a new project on Railway and connect it to your GitHub repo.
3. Set the environment variables in Railway's project settings.
4. Railway will automatically detect the `start` script and run `node src/server.js`.
5. Your backend should be live and accessible via the Railway URL.

## Notes

- Make sure to add a `start` script in your `package.json` (already present).
- Ensure your server listens on the port from the environment variable `PORT`.

---

This file documents how to deploy the backend on Railway.
