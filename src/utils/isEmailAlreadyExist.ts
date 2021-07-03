import joiful from 'joiful';

export const validateFunction = async (argValue: any, argType: any) => {
	const result = joiful?.validateAsClass(argValue, argType);
	if (result?.error) throw result?.error;
};
