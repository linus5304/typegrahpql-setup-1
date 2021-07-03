import { MiddlewareFn } from 'type-graphql';
import { MyContext } from './../../types/MyContext';

export const isAuth: MiddlewareFn<MyContext> = async (
	{ context: { req } },
	next
) => {
	if (!req.session!.userId) {
		throw new Error('not authenticated');
	}
	return next();
};
