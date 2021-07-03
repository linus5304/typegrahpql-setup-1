import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createConnection } from 'typeorm';

import { User } from './entities/User';

import session from 'express-session';
import connectRedis from 'connect-redis';
import { redis } from './redis';
import cors from 'cors';
import { createSchema } from './../utils/createSchema';

const main = async () => {
	const RedisStore = connectRedis(session);

	const conn = await createConnection({
		type: 'postgres',
		username: 'postgres',
		password: 'toor',
		database: 'typegraphql_example',
		synchronize: true,
		logging: true,
		entities: [User],
	});

	const schema = await createSchema();

	const apolloServer = new ApolloServer({
		schema,
		context: ({ req }: any) => ({ req }),
	});
	const app = express();

	app.use(
		cors({
			credentials: true,
			origin: 'http://localhost:3000',
		})
	);

	app.use(
		session({
			store: new RedisStore({
				client: redis as any,
			}),
			name: 'qid',
			secret: 'fajkdjadjalfjdfa',
			resave: false,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				maxAge: 1000 * 60 * 60 * 24 * 7 * 365,
			},
		} as any)
	);

	app.get('/hello3', (_, res) => {
		res.send('hello 3');
	});
	apolloServer.applyMiddleware({ app });

	app.listen(4000, () => {
		console.log('server started on http://localhost:4000/graphql');
	});
};

main();
