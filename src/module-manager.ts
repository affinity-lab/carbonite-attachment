import {Atom, ModuleManager} from "@affinity-lab/carbonite";
import {DataSource} from "typeorm";
import CollectionDescriptor from "./collection-descriptor";
import Subscriber from "./subscriber";
import storage from "./storage";

let attachmentModuleManager = new (class extends ModuleManager {
	private collectionDescriptors: Array<CollectionDescriptor> = [];
	async initialize(dataSource: DataSource) {
		let atoms = [...(new Set(this.collectionDescriptors.map((descriptor: CollectionDescriptor) => descriptor.atom)))]
		atoms.forEach(atom => {
			let descriptors = this.collectionDescriptors.filter(descriptor => descriptor.atom === atom);
			dataSource.subscribers.push(new Subscriber(atom, descriptors))
		});
		this.collectionDescriptors.forEach(descriptor => storage.collections[descriptor.cid] = descriptor)
	}
	addCollectionDescriptor(collectionDescriptor: CollectionDescriptor) { this.collectionDescriptors.push(collectionDescriptor);}
	getCollectionsOf(atom: typeof Atom): Array<CollectionDescriptor> { return this.collectionDescriptors.filter(descriptor => descriptor.atom === atom);}
})();

export default attachmentModuleManager;
