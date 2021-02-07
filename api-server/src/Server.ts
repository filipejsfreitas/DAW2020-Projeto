/* eslint-disable @typescript-eslint/restrict-template-expressions */
import morgan from 'morgan';
import helmet from 'helmet';
import logger from '@shared/Logger';

import passport from 'passport';
import mongoose from 'mongoose';

import express, { NextFunction, Request, Response } from 'express';
import createError, { HttpError } from 'http-errors';

import { UserModel } from '@models/User';
import extractJwt from './middleware/ExtractJwt';
import extractUser from './middleware/ExtractUser';

import IndexRouter from './routes/Index';
import ResourcesRouter from './routes/Resources';
import TagsRouter from './routes/Tags';
import CommentsRouter from './routes/Comments';
import RepliesRouter from './routes/Replies';
import FilesRouter from './routes/Files';
import UsersRouter from './routes/Users';
import ResourceTypesRouter from './routes/ResourceTypes';
import AuthRouter from './routes/Auth';
import DocsRouter from './routes/Docs';

const app = express();

/************************************************************************************
 *                              Initialize Mongoose
 ***********************************************************************************/

const { MONGODB_ADDRESS, MONGODB_PORT, MONGODB_DATABASE, MONGODB_USER, MONGODB_PASSWORD }
    = process.env;

let mongooseUsernamePassword = '';
if(MONGODB_USER && MONGODB_PASSWORD) {
  mongooseUsernamePassword = `${MONGODB_USER}:${MONGODB_PASSWORD}@`;
}

mongoose.connect(
`mongodb://${mongooseUsernamePassword}${MONGODB_ADDRESS}:${MONGODB_PORT}/${MONGODB_DATABASE}`,
  { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 }
);

mongoose.connection.on('error', err => {
  logger.err('Failed to connect to MongoDB! Please check your credentials.');
  // We want to crash the app because this app requires the database to do literally anything
  throw err;
});

mongoose.connection.once('open', () => logger.info('Connected to MongoDB!'));

/************************************************************************************
 *                              Setup Passport
 ***********************************************************************************/

passport.use(UserModel.createStrategy());

/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Security
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
}

app.use(passport.initialize());
app.use(extractJwt);
app.use(extractUser);

// Add Routers
app.use('/', IndexRouter);
app.use('/resources', ResourcesRouter);
app.use('/tags', TagsRouter);
app.use('/comments', CommentsRouter);
app.use('/replies', RepliesRouter);
app.use('/files', FilesRouter);
app.use('/users', UsersRouter);
app.use('/resourceTypes', ResourceTypesRouter);
app.use('/auth', AuthRouter);
app.use('/docs', DocsRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Print API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  logger.err(err, true);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.jsonp({ error: res.locals });
});

// Export express instance
export default app;
