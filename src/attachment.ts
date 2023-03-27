import {AfterRemove, AfterUpdate, Column, Entity, MoreThanOrEqual, UpdateDateColumn} from "typeorm"

import Image from "./image";
import {Atom} from "@affinity-lab/carbonite";
import CollectionOwner from "./collection-owner";
import AttachmentUpdated from "./events/attachment-updated";
import AttachmentRemoved from "./events/attachment-removed";
import type CollectionDescriptor from "./collection-descriptor";
import type {GuardFunction} from "./collection";
import {Export, FileDescriptor, MaterializeIt} from "@affinity-lab/util";
import AttachmentService from "./attachment-service";

@Entity({name: AttachmentService.instance.table})
export default class Attachment extends Atom {
	@Export() id: number;
	@Column({type: "varchar", length: "255"}) private fileName: string
	@Export() @Column({type: "varchar", length: "255"}) mimeType: string
	@Export() @Column({type: "int", unsigned: true}) size: number
	@Export() @Column({type: "varchar", length: 255, default: null}) title: string | null;
	@Export() @Column({type: "int", unsigned: true}) position: number;
	@Export() @Column({type: 'json', default: null}) image: Image | null
	@Column({update: false, type: "varchar", length: "255"}) entity: string;
	@Column({update: false, type: "varchar", length: "255"}) collection: string;
	@Column({update: false, type: "int", unsigned: true}) ownerId: number;
	@UpdateDateColumn({type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)"}) public updated_at: Date;

	@MaterializeIt() get owner(): CollectionOwner {return new CollectionOwner(this.entity, this.collection, this.ownerId);}
	@Export() get ver(): string { return Math.ceil((this.updated_at.getTime() / 1000)).toString(36); }
	@Export() get name(): string {return this.fileName;}
	set name(name: string) {this.rename(name);}
	@Export() get isImage(): boolean {return this.image !== null;}
	get path(): string {return AttachmentService.instance.pathStrategy.createPath(this);}
	get fullPath(): string {return AttachmentService.instance.fullPath(this);}
	@MaterializeIt() get ownerItem(): Promise<Atom> { return this.collectionDescriptor.atom.pick(this.ownerId)}
	get collectionDescriptor(): CollectionDescriptor {return AttachmentService.instance.collections[this.owner.cid];}
	get isGuarded(): boolean {return this.collectionDescriptor.isGuarded;}
	get guard(): GuardFunction | undefined {return this.collectionDescriptor.guard}

	async setPosition(position: number) {
		await Attachment.createQueryBuilder().update({position: () => "position+1"})
			.where({...this.owner, position: MoreThanOrEqual(position)})
			.orderBy({position: "ASC"})
			.execute();
		this.position = position;
		await this.save();
		await Attachment.reorder(this.owner);
	}

	async rename(name: string) {
		if (this.fileName === name) return;
		await AttachmentService.instance.renameFile(this, name);
		this.fileName = name;
		await this.save();
	}

	async delete(reorder: boolean = true) {
		try{
			await AttachmentService.instance.deleteFile(this);
		}catch (e){
			console.error("Could not delete file for " + this.id)
		}
		await this.remove();
		if (reorder) await Attachment.reorder(this.owner);
	}

	static async factory(file: FileDescriptor, owner: CollectionOwner): Promise<Attachment> {
		let record = new this();
		record.fileName = file.name;
		record.mimeType = file.mimeType ? file.mimeType : "";
		record.size = await file.size;
		record.collection = owner.collection;
		record.entity = owner.entity;
		record.ownerId = owner.id;
		record.image = file.isImage ? new Image(
			(await file.image).meta.width,
			(await file.image).meta.height,
			(await file.image).stats.dominant,
			(await file.image).meta.pages > 1
		) : null;
		record.position = (await this.getMaxPos(owner)) + 1;

		let attachment = await record.save();
		await AttachmentService.instance.storeFile(file.file, attachment);
		return attachment;
	}

	static async getMaxPos(owner: CollectionOwner): Promise<number | null> {
		return (await this.createQueryBuilder()
				.select("Max(position) AS MaxPos")
				.where(owner)
				.getRawOne()
		)['MaxPos'];
	}

	static async reorder(owner: CollectionOwner) {
		await this.query(`SET @pos:=-1`);
		await this.createQueryBuilder().update({position: () => "(@pos := @pos+1)"}).where(owner).orderBy({position: "ASC"}).execute();
	}
	static async allForOwner(owner: CollectionOwner): Promise<Array<Attachment>> {return this.find({where: owner});}
	static async countOfOwner(owner: CollectionOwner): Promise<number> { return this.countBy(owner);}
	static async firstOfOwner(owner: CollectionOwner): Promise<Attachment | null> { return this.findOne({where: owner, order: {position: "ASC"}});}
	static async findOfOwner(owner: CollectionOwner, fileName: string): Promise<Attachment[]> { return this.createQueryBuilder().where("fileName LIKE :fileName", {fileName}).andWhere(owner).orderBy({position: "ASC"}).getMany();}
	static async pickOfOwner(owner: CollectionOwner, id: number): Promise<Attachment | null> { return this.findOne({where: {...owner, id}});}

	@AfterUpdate() afterUpdate() { AttachmentService.instance.eventSource.emit(new AttachmentUpdated(this.id));}
	@AfterRemove() afterRemove() { AttachmentService.instance.eventSource.emit(new AttachmentRemoved(this.id));}
}
