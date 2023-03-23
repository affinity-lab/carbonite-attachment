import express, {NextFunction, Request, Response} from "express";
import attachmentConfig from "../config";
import sharp from "sharp";
import Attachment from "../attachment";
import path from "path";

export default class ImgService {

	static createFileName(req: Request): string {
		let id = req.params["id"];
		let file = req.params["file"];
		let ext = req.params["ext"];
		let dim = req.params["dim"];
		let ver = req.params["ver"];
		return `/${id}-${ver}-${dim}-${file}.${ext}`;
	}

	static router() {
		return express.Router()
			.use("/:id/:ver/:dim/:file.:ext", express.Router({mergeParams: true})
				.use(ImgService.resolveUrl())
				.use(ImgService.setCache())
				.use(ImgService.serveStatic())
				.use(ImgService.resolveNotFound())
				.use((req: Request, res: Response) => res.sendStatus(404))
			)
	}

	static resolveUrl() {
		return (req: Request, res: Response, next) => {
			req.url = this.createFileName(req);
			next();
		}
	}

	static setCache() {
		return async (req: Request, res: Response, next: NextFunction) => {
			let maxAge: number = attachmentConfig.attachmentMaxAge;
			let maxAgeHeader = req.headers["x-set-max-age"];
			if (maxAgeHeader !== undefined) {
				if (Array.isArray(maxAge)) maxAgeHeader = maxAge[0];
				maxAge = parseInt(maxAgeHeader.toString());
			}
			res.setHeader("cache-control", "public, max-age=" + maxAge)
			next();
		}
	}

	static resolveNotFound() {
		return async (req: Request, res: Response, next: NextFunction) => {
			let id = req.params["id"];
			let out = this.createFileName(req);
			let attachment = await Attachment.pick(parseInt(id, 36));
			let [width, height] = req.params["dim"].split("x");
			if (attachment !== null) {
				await sharp(attachmentConfig.path + '/' + attachment.path, {animated: true})
					.resize(parseInt(width), parseInt(height), {
						kernel: sharp.kernel.lanczos3,
						fit: 'cover',
						position: attachment.image?.focus ?? 'centre',
						withoutEnlargement: true,
					})
					.toFile(attachmentConfig.imgPath + '/' + out);
				res.sendFile(path.resolve(attachmentConfig.imgPath + '/' + out));
			} else {
				next();
			}
		}
	}
	static serveStatic() { return express.static(attachmentConfig.imgPath)}
}