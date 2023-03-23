import {EntitySubscriberInterface, RemoveEvent} from "typeorm";
import {Atom} from "@affinity-lab/carbonite";
import Collection from "./collection";
import CollectionDescriptor from "./collection-descriptor";

export default class Subscriber implements EntitySubscriberInterface<Atom> {
	constructor(readonly atom: typeof Atom, readonly descriptors: Array<CollectionDescriptor>) {}
	public listenTo() {return this.atom}
	public async afterRemove(event: RemoveEvent<Atom>): Promise<void> {
		this.descriptors.forEach(descriptor => (event.entity[descriptor.name] as Collection).purge());
	}
}
