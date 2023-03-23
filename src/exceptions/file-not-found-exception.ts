export default class FileNotFoundException extends Error{
	constructor(readonly file:string) {
		super(`file ${file} not found`);
	}
}