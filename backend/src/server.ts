import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { prisma } from './lib/prisma'
import { requireAuth } from './middleware/auth.middleware'
import authRoutes from './routes/auth.routes'
import jobsRoutes from './routes/jobs.routes'
import applicationsRoutes from './routes/applications.routes'
import dashboardRoutes from './routes/dashboard.routes'
import interviewsRoutes from './routes/interviews.routes'
import contactsRoutes from './routes/contacts.routes'
const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())
app.use('/api/applications', applicationsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/interviews', interviewsRoutes)
app.get('/api/health', async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`

  response.status(200).json({
    status: 'ok',
    message: 'Job Hunt Command Center API and database are running',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/jobs', requireAuth, jobsRoutes)
app.use('/api/contacts', contactsRoutes)

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`)
})
