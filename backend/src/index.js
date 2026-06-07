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
  app.listen(port, () => console.log(`Server started on port ${port}`));
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
