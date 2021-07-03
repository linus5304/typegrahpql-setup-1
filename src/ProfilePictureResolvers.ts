import { GraphQLUpload } from 'apollo-server-express';
import { createWriteStream } from 'fs';
import { GraphQLScalarType } from 'graphql';
import { Arg, Mutation, Resolver } from 'type-graphql';
import { Upload } from './../types/Upload';

@Resolver()
export class ProfilePictureResolvers {
	@Mutation(() => Boolean)
	async addProfilePicture(
		@Arg('picture', () => GraphQLUpload)
		{ filename, createReadStream }: Upload
	): Promise<boolean> {
		return new Promise(async (resolve, reject) => {
			createReadStream()
				.pipe(createWriteStream(__dirname + `../images/${filename}`))
				.on('finish', () => resolve(true))
				.on('error', () => reject(false));
		});
	}
}

