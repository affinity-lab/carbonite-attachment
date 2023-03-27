import CollectionDescriptor from "./collection-descriptor";
import Collection, {type GuardFunction} from "./collection";
import CollectionOwner from "./collection-owner";
import {Atom, ModuleManager} from "@affinity-lab/carbonite";
import type {Dimension} from "@affinity-lab/util";
import type {DataSource, EntitySubscriberInterface, RemoveEvent} from "typeorm";
import AttachmentService from "./attachment-service";

export default function AttachmentCollection(
	mimeType: Array<string> | string | null = null,
	maxFileCount: number = Infinity,
	maxFileSizeKByte: number = Infinity,
	minImageSize: Dimension | null = null,
	guard: undefined | GuardFunction = undefined
) {
	return function (target: Object, propertyKey: string) {
		let descriptor = new CollectionDescriptor(
			target.constructor as typeof Atom,
			propertyKey,
			mimeType,
			maxFileCount,
			maxFileSizeKByte * 1024,
			minImageSize,
			guard
		);

		moduleManager.addCollectionDescriptor(descriptor);

		Object.defineProperty(target, propertyKey, {
			get: function () {
				let value = new Collection(new CollectionOwner(descriptor.entity, descriptor.name, this), descriptor);
				Object.defineProperty(this, propertyKey, {value});
				return value;
			},
		});
	}
}

let moduleManager = new (class extends ModuleManager {
	private collectionDescriptors: Array<CollectionDescriptor> = [];
	async initialize(dataSource: DataSource) {
		let atoms = [...(new Set(this.collectionDescriptors.map((descriptor: CollectionDescriptor) => descriptor.atom)))]
		atoms.forEach(atom => {
			let descriptors = this.collectionDescriptors.filter(descriptor => descriptor.atom === atom);
			dataSource.subscribers.push(new Subscriber(atom, descriptors))
		});
		this.collectionDescriptors.forEach(descriptor => AttachmentService.instance.collections[descriptor.cid] = descriptor)
	}
	addCollectionDescriptor(collectionDescriptor: CollectionDescriptor) { this.collectionDescriptors.push(collectionDescriptor);}
	getCollectionsOf(atom: typeof Atom): Array<CollectionDescriptor> { return this.collectionDescriptors.filter(descriptor => descriptor.atom === atom);}
})();


class Subscriber implements EntitySubscriberInterface<Atom> {
	constructor(readonly atom: typeof Atom, readonly descriptors: Array<CollectionDescriptor>) {}
	public listenTo() {return this.atom}
	public async afterRemove(event: RemoveEvent<Atom>): Promise<void> {
		this.descriptors.forEach(descriptor => (event.entity[descriptor.name] as Collection).purge());
	}
}
