import { User } from '../entities/User';
import { createConnection } from 'typeorm';

export const testConn = (drop: boolean = false) => {
	return createConnection({
		type: 'postgres',
		username: 'postgres',
		password: 'toor',
		database: 'typegraphql_example_test',
		synchronize: drop,
		dropSchema: drop,
		entities: [User],
	});
};
