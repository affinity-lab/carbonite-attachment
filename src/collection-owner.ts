import {Atom} from "@affinity-lab/carbonite";

export default class CollectionOwner {

	readonly ownerId: number
	get id(): number {return this.ownerId;}
	get cid(): string {return `${this.entity}/${this.collection}`}

	constructor(readonly entity: string, readonly collection: string, ownerId: number | Atom) {
		this.ownerId = typeof ownerId === "number" ? ownerId : ownerId.id;
	}
}