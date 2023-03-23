import {Atom} from "@affinity-lab/carbonite";
import {GuardFunction} from "./collection";
import {Dimension} from "@affinity-lab/util";

export default class CollectionDescriptor {
	readonly entity: string;

	constructor(
		readonly atom: typeof Atom,
		readonly name: string,
		readonly mimeType: Array<string> | string | null = null,
		readonly maxFileCount: number = Infinity,
		readonly maxFileSize: number = Infinity,
		readonly minImageSize: Dimension = null,
		readonly guard: undefined | GuardFunction = undefined
	) {
		this.entity = atom.name;
	}
	get cid(): string {return `${this.entity}/${this.name}`;}
	get isGuarded(): boolean {return this.guard !== undefined;}
}