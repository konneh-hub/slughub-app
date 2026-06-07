const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./prismaClient');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/permissions', permissionRoutes);

app.use(errorHandler);

const port = config.port;

async function main() {
  const server = app.listen(port, () => console.log(`Server started on port ${port}`));
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please free the port or set PORT to a different value.`);
      process.exit(1);
    }
    console.error('Server error', err);
    process.exit(1);
  });
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
