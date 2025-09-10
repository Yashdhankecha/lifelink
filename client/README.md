# Life Link Frontend Deployment

## Deployment on Vercel

1. Push your frontend code to a GitHub repository.
2. Create a new project on Vercel and connect it to your GitHub repo.
3. Set any necessary environment variables in Vercel's project settings (if your frontend uses any).
4. Vercel will detect the `build` script and run `vite build` automatically.
5. Your frontend will be deployed and accessible via the Vercel URL.

## Notes

- Ensure your frontend uses relative or absolute URLs correctly to communicate with the backend deployed on Railway.
- You can set environment variables in Vercel for API URLs or other configs.

---

This file documents how to deploy the frontend on Vercel.
