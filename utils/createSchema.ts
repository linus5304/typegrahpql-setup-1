import { UserResolver } from './../src/resolvers/user';
import { buildSchema } from 'type-graphql';
import { ProfilePictureResolvers } from './../src/ProfilePictureResolvers';
import {
	CreateProductResolver,
	CreateUserResolver,
} from './../src/createUserResolver';

export const createSchema = () =>
	buildSchema({
		resolvers: [
			UserResolver,
			CreateUserResolver,
			CreateProductResolver,
			ProfilePictureResolvers,
		],
		authChecker: ({ context: { req } }) => {
			return !!req.session.userId;
			// 	if(req.session.userId){
			// 		return true
			// 	}
			// 	return false;
			//   }
		},
	});
