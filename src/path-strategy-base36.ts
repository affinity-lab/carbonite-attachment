import Attachment from "./attachment";

export default class PathStrategyBase36 {
	createPath(attachment: Attachment, name: string | null = null): string {
		let b36 = attachment.id.toString(36).padStart(6, "0");
		return `${b36[0]}${b36[1]}/${b36[2]}${b36[3]}/${b36[4]}${b36[5]}${attachment.isGuarded ? '@' : '.'}${name ?? attachment.name}`;
	}

	private idToPath(id: number): string {
		let b36 = id.toString(36).padStart(6, "0");
		return `${b36.substring(0, 2)}/${b36.substring(2, 4)}/${b36.substring(4, 6)}`;
	}
}
