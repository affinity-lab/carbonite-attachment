class AttachmentConfig {
	public table: string;
	public path: string
	public imgPath: string
	public attachmentMaxAge: number = 0;
	public imageMaxAge: number = 0;
}

let attachmentConfig = new AttachmentConfig();
export default attachmentConfig;