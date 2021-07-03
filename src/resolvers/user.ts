import argon2 from 'argon2';
import {
	Arg,
	Ctx,
	Field,
	InputType,
	Mutation,
	Query,
	Resolver,
	UseMiddleware,
} from 'type-graphql';
import { User } from './../entities/User';
import { IsEmail } from 'class-validator';
import { MyContext } from './../../types/MyContext';
import { isAuth } from '../middleware/isAuth';
import { sendEmail } from '../utils/sendEmail';
import { createConfirmationUrl } from '../utils/createComfimationUrl';
import { redis } from '../redis';
import { v4 } from 'uuid';
import { PasswordInput } from './../shared/passwordInput';
import {
	confirmUserPrefix,
	forgotPasswordPrefix,
} from '../constants/redisPrefixes';

@InputType()
export class UserInput extends PasswordInput {
	@Field()
	firstName: string;
	@Field()
	lastName: string;
	@Field()
	@IsEmail()
	email: string;
}

@InputType()
export class changePasswordInput extends PasswordInput {
	@Field()
	token: string;
	@Field()
	password: string;
}

@Resolver()
export class UserResolver {
	@UseMiddleware(isAuth)
	@Query(() => String, { nullable: true })
	hello() {
		return 'Hello world';
	}

	@Mutation(() => User)
	async register(
		@Arg('data') { firstName, lastName, email, password }: UserInput
	): Promise<User> {
		const hashedPassword = await argon2.hash(password);

		const user = await User.create({
			firstName,
			lastName,
			email,
			password: hashedPassword,
		}).save();

		await sendEmail(email, await createConfirmationUrl(user.id));
		return user;
	}

	@Mutation(() => User, { nullable: true })
	async login(
		@Arg('email') email: string,
		@Arg('password') password: string,
		@Ctx() { req }: MyContext
	): Promise<User | null> {
		const user = await User.findOne({ where: { email } });
		if (!user) {
			return null;
		}

		const valid = await argon2.verify(user.password, password);

		if (!valid) {
			return null;
		}

		if (!user.confirmed) {
			return null;
		}

		req.session!.userId = user.id;

		return user;
	}

	@Query(() => User, { nullable: true })
	async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
		if (!req.session!.userId) {
			return undefined;
		}
		return await User.findOne(req.session!.userId);
	}

	@Mutation(() => Boolean)
	async confirmUser(@Arg('token') token: string) {
		const userId = parseInt(
			(await redis.get(confirmUserPrefix + token)) as string
		);
		if (!userId) {
			return false;
		}

		User.update({ id: userId }, { confirmed: true });
		redis.del(token);
		return true;
	}

	@Mutation(() => Boolean)
	async forgotPassword(@Arg('email') email: string): Promise<boolean> {
		const user = await User.findOne({ where: { email } });
		if (!user) {
			return true;
		}

		const token = v4();
		redis.set(forgotPasswordPrefix + token, user.id, 'ex', 60 * 60 * 24);

		const url = `http://localhost:3000/user/change-password/${token}`;
		sendEmail(email, url);

		return true;
	}

	@Mutation(() => User)
	async changePassword(
		@Arg('data') { token, password }: changePasswordInput,
		@Ctx() { req }: MyContext
	): Promise<User | undefined> {
		const userId = parseInt(
			(await redis.get(forgotPasswordPrefix + token)) as string
		);

		if (!userId) {
			return undefined;
		}

		redis.del(forgotPasswordPrefix + token);

		const user = await User.findOne(userId);

		user!.password = await argon2.hash(password);
		await user?.save();

		req.session!.userId = user!.id;

		return user;
	}
}
